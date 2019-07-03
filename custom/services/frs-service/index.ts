import { Config } from 'core/config.gen';
import * as request from 'request';
import * as http from 'http';
import { client } from 'websocket';
import { Observable, BehaviorSubject, Subject, Observer } from 'rxjs';
import { Response } from '~express/lib/response';
import { promisify } from 'bluebird';
import { FaceFeatureCompare } from './frs-service/face-feature';
import { UserType, sjRecognizedUser, sjUnRecognizedUser, RecognizedUser, UnRecognizedUser } from './frs-service/core';
export * from './frs-service/core';
import { filterFace } from './frs-service/filter-face';
import { semaphore } from './frs-service/semaphore';
import { Semaphore } from 'helpers/utility/semaphore';
import { searchRecognizedFace } from './frs-service/search-recognized-face';
import { searchUnRecognizedFace } from './frs-service/search-unrecognized-face';
import { saveSnapshot } from './frs-service/save-snapshot';
import * as mongo from 'mongodb';

const collection: string = "FRSFaces";

const groups: string[] = Config.fts.groupInfo.map( (data) => data.name );

export interface FetchOptions {
    excludeFaceFeature?: boolean;
    name?: string;
    groups?: string[];
    cameras?: string[];
}

export class FRSService {
    private sessionId: string;
    private sjLogined: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    private sjRecovered: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    private livestream: Observable<RecognizedUser | UnRecognizedUser>;
    public sjLiveFace: Subject<RecognizedUser | UnRecognizedUser> = new Subject();

    private db: mongo.Db;

    constructor() {
        this.login();

        (async () => {
            /// create db
            const url = `mongodb://${Config.mongodb.ip}:${Config.mongodb.port}`;
            let client = await mongo.MongoClient.connect(url);
            this.db = client.db(Config.mongodb.collection);

            /// init main stream
            this.livestream = Observable.merge(sjRecognizedUser, sjUnRecognizedUser)
                .pipe( filterFace( async (compared) => {
                    await this.waitForRecover();
                    await this.waitForLogin();
                    this.sjLiveFace.next(compared);
                }) );
        })();
    }

    /// private functions ///////////////////
    private loggingIn: boolean = false;
    private maintainTimer: NodeJS.Timer = null;
    private login() {
        const url = this.makeUrl("login");

        let tryLogin = () => {
            if (this.loggingIn === true) return;
            this.loggingIn = true;

            request({
                url, method: 'POST', json: true,
                body: { username: Config.frs.account, password: Config.frs.password }
            }, (err, res, body) => {
                this.loggingIn = false;
                if (err || !body) {
                    console.log(`Login FRS Server failed@${Config.frs.ip}:${Config.frs.port}. Retry in 1 second.`);
                    setTimeout(() => { tryLogin() }, 1000);
                    return;
                }

                this.sjLogined.next(true);
                console.log(`Login into FRS Server@${Config.frs.ip}:${Config.frs.port}.`);

                this.sessionId = body.session_id;
                /// After login and got session_id, maintain session every 1 minute.
                if (this.maintainTimer !== null) clearInterval(this.maintainTimer);
                this.maintainTimer = setInterval( async () => {
                    var result = await this.maintainSession();
                    if (!result) clearInterval(this.maintainTimer);
                }, 60000);
                this.doWebsocketListen();
            });
            
        }
        tryLogin();
    }

    private maintainSession(): Promise<boolean> {
        const url: string = this.makeUrl('maintainsession');
        var me = this;

        return new Promise( (resolve, reject) => {
            request({
                url, method: 'POST', json: true,
                body: { session_id: this.sessionId }
            }, (err, res, body) => {
                if (!body || body.message === 'Unauthorized.') {
                    this.sjLogined.next(false);
                    console.log(`Maintain FRS session failed@${Config.frs.ip}:${Config.frs.port}.`);
                    resolve(false);
                    me.login();
                    return;
                }
                console.log('maintain success', body);
                resolve(true);
            });

        });
    }

    websocketInited: boolean = false;
    private doWebsocketListen() {
        if (this.websocketInited) return;
        this.websocketInited = true;
        function makeConnection(url: string, callback: (data: any) => void) {
            var cli = new client();
            var me = this;
            var timer;
            function reconnect() {
                timer && clearTimeout(timer);
                timer = setTimeout( () => makeConnection.call(me, url, callback), 1000 );
            }

            cli.on('connect', (connection) => {
                connection.on('error', (err) => {
                    console.log("FRS Connection Error", err);
                    reconnect();
                });
                connection.on('close', () => {
                    console.log("FRS Connection Closed");
                    reconnect();
                });
                connection.on('message', (message) => {
                    var data = eval(`(${message.utf8Data})`);
                    let code = (<any>data).code;
                    if (code) {
                        if (code === 200) return;
                        if (code === 401) {
                            console.log('FRS error, message', data);
                            me.login();
                            return;
                        }
                        console.log('FRS error, message', data);
                        return;
                    }
                    callback && callback(data);
                });
                connection.sendUTF(JSON.stringify({
                    "session_id": this.sessionId
                }));
            });
            cli.on('connectFailed', (err) => {
                console.log("FRS Connect Error: ", err);
                    setTimeout( () => reconnect() );
            });
            cli.connect(url, 'echo-protocol');
        }

        const url: string = `ws://${Config.frs.ip}:${Config.frs.wsport}/frs/ws/fcsreconizedresult`;
        const urlnon: string = `ws://${Config.frs.ip}:${Config.frs.wsport}/frs/ws/fcsnonreconizedresult`;
        makeConnection.call(this, url, (data: RecognizedUser) => {
            // console.log('recognized result', data);
            sjRecognizedUser.next({type: UserType.Recognized, ...data});
        });
        makeConnection.call(this, urlnon, (data: UnRecognizedUser) => {
            // console.log('unrecognized result', data);
            sjUnRecognizedUser.next({type: UserType.UnRecognized, ...data});
        });
    }
    /////////////////////////////////

    /// private helpers /////////////
    private makeUrl(func: string) {
        const urlbase: string = `http://${Config.frs.ip}:${Config.frs.port}/frs/cgi`;
        return `${urlbase}/${func}`;
    }
    private waitForLogin() {
        return this.sjLogined.getValue() === true ? null :
            this.sjLogined.filter(val => val === true).first().toPromise();
    }
    private waitForRecover() {
        return this.sjRecovered.getValue() === true ? null :
            this.sjRecovered.filter(val => val === true).first().toPromise();
    }
    private makeDBObject(data: RecognizedUser | UnRecognizedUser) {
        let o: any = data;
        // let picked = ((
        //     { type, person_info, person_id, score, snapshot, channel, timestamp, groups, face_feature, highest_score }
        // ) => (
        //     { type, person_info, person_id, score, snapshot, channel, timestamp, groups, face_feature, highest_score }
        // ))(o);
        let picked = ((
            { type, person_id, snapshot, channel, timestamp, face_feature }
        ) => (
            { type, person_id, snapshot, channel, timestamp, face_feature }
        ))(o) as any;
        o.person_info !== undefined && (picked.person_info = o.person_info);
        o.score !== undefined && (picked.score = o.score);
        o.groups !== undefined && (picked.groups = o.groups);
        o.highest_score !== undefined && (picked.highest_score = o.highest_score);
        //picked.face_feature = new Buffer(o.face_feature, 'binary');

        return picked;
    }
    /////////////////////////////////
}

export default new FRSService();
