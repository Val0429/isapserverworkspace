import { Config } from 'core/config.gen';
import * as request from 'request';
import * as http from 'http';
import { client } from 'websocket';
import { Observable, BehaviorSubject, Subject, Observer } from 'rxjs';
import { Response } from '~express/lib/response';
import { promisify } from 'bluebird';
import { FaceFeatureCompare } from './../modules/face-feature-compare';
import { UserType, sjRecognizedUser, sjUnRecognizedUser, RecognizedUser, UnRecognizedUser } from './frs-service/core';
export * from './frs-service/core';
import { filterFace } from './frs-service/filter-face';
import * as mongo from 'mongodb';

export class FRSService {
    private sessionId: string;
    private sjLogined: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    private livestream: Observable<RecognizedUser | UnRecognizedUser>;
    public sjLiveFace: Subject<RecognizedUser | UnRecognizedUser> = new Subject();

    constructor() {
        this.login();

        /// init main stream
        this.livestream = Observable.merge(sjRecognizedUser, sjUnRecognizedUser)
            .pipe( filterFace( (compared) => {
                this.sjLiveFace.next(compared);
            }) );
        /// subscribe to write db
        this.livestream.subscribe();

        /// recover db
        this.recoverDB();
    }

    /// public functions ////////////////////
    lastImages(start: number = null, end: number = null): Subject<RecognizedUser | UnRecognizedUser> {
        if (end === null || start === null) {
            const hours = 60*60*1000;
            end = Date.now();
            start = end - 8 * hours;
        }
        return this.searchAll(start, end);
    }
    snapshot(image: string, resp: Response): Promise<void> {
        return new Promise<void>( (resolve, reject) => {
            var url: string = this.makeUrl(`snapshot/session_id=${this.sessionId}&image=${image}`);
            request({
                url,
                method: 'GET',
                encoding: null
            }, (err, res, body) => {
                resp.setHeader("content-type", res.headers["content-type"]);
                resp.end(body, "binary");
                resolve();
            });
        });
    }
    searchAll(starttime: number, endtime: number): Subject<RecognizedUser | UnRecognizedUser> {
        var sj = new Subject<RecognizedUser | UnRecognizedUser>();

        const url: string = this.makeUrl('getverifyresultlist');
        const urlnon: string = this.makeUrl('getnonverifyresultlist');

        /// get raw data from FRS, merge all pages
        function poll(starttime: number, endtime: number, url: string, page: number = 0): Observable<RecognizedUser[] | UnRecognizedUser[]> {
            function doRequest(observer: Observer<any>, page: number = 0)  {
                let bodyparam = { session_id: this.sessionId, start_time: starttime, end_time: endtime, page_size : 20, skip_pages: page };
                request({
                    url,
                    method: 'POST',
                    json: true,
                    body: bodyparam
                }, (err, res, body) => {
                    // console.log('body', body);
                    var result = (body.result || body.group_list || {});
                    var results = result.verify_results;
                    //console.log(url, bodyparam, results.length);
                    if (!results || results.length === 0) {
                        observer.complete();
                        return;
                    }
                    observer.next(results);
                    doRequest.call(this, observer, result.page_index+1);
                });
            }

            return Observable.create( (observer) => {
                doRequest.call(this, observer);
            }).share();
        }

        /// indexes
        var recog = { timestamp: 0, finished: false, data: [] };
        var unrecog = { timestamp: 0, finished: false, data: [] };
        var queue = [];
       
        /// finalize search result
        async function queueHandler() {
            while (queue.length > 0) {
                sj.next(queue.shift());
            }

            if (recog.finished === true && unrecog.finished === true)
                sj.complete();
        }

        function prepareQueue(recognizeBase: boolean) {
            var base = recognizeBase ? recog : unrecog;
            var ref = recognizeBase ? unrecog : recog;
            if (base.data.length === 0) return;
            while (base.data.length > 0) {
                /// 1) get time
                var basetime = base.data[0].timestamp;
                var reftime = ref.data.length > 0 ? ref.data[0].timestamp : Number.MAX_SAFE_INTEGER;
                /// 2) if >= ref timestamp, return
                if (!ref.finished && basetime > ref.timestamp) return;
                /// 3) pick one smaller
                if (basetime <= reftime) queue.push( base.data.shift() );
                else queue.push( ref.data.shift() );
            }
            queueHandler();
        }

        (async () => {
            await this.waitForLogin();

            /// handle response
            var obRecog = poll.call(this, starttime, endtime, url);
            obRecog.subscribe({
                    next: (data: RecognizedUser[]) => {
                        recog.timestamp = data[data.length-1].timestamp;
                        data.forEach( (value: RecognizedUser) => value.type = UserType.Recognized );
                        recog.data.push.apply(recog.data, data);
                        prepareQueue(true);
                    },
                    complete: () => {
                        recog.finished = true;
                        prepareQueue(true);
                    }
                });
            var obUnRecog = poll.call(this, starttime, endtime, urlnon);
            obUnRecog.subscribe({
                    next: (data: UnRecognizedUser[]) => {
                        unrecog.timestamp = data[data.length-1].timestamp;
                        data.forEach( (value: UnRecognizedUser) => value.type = UserType.UnRecognized );
                        unrecog.data.push.apply(unrecog.data, data);
                        prepareQueue(false);
                    },
                    complete: () => {
                        unrecog.finished = true;
                        prepareQueue(false);
                    }
                });

            Observable.forkJoin(obRecog, obUnRecog)
                .subscribe( () => {
                    /// combine last
                    var final = [ ...recog.data, ...unrecog.data ].sort( (a, b) => a.timestamp - b.timestamp );
                    queue.push.apply(queue, final);
                    queueHandler();
                });
        })();
       
        return sj;
    }
    search(face: RecognizedUser | UnRecognizedUser, starttime: number, endtime: number): Subject<RecognizedUser | UnRecognizedUser> {
        return new Subject();
    }
    /////////////////////////////////////////

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

    private async recoverDB() {
        await this.waitForLogin();

        /// read local db
        const url = `mongodb://${Config.mongodb.ip}:${Config.mongodb.port}`;
        let client = await mongo.MongoClient.connect(url);
        let db = client.db(Config.mongodb.collection);
        let col = db.collection("FRSFaces");
        console.log( 'count?', await col.find().count() );


        ///
        console.time("123");
        let count = 0;
        //this.lastImages(0, Number.MAX_SAFE_INTEGER)
        this.lastImages()
            .pipe( filterFace() )
            .subscribe( (data) => {
                count++;
            }, () => {}, () => {
                console.log('total', count);
                console.timeEnd("123");
            });
    }
    /////////////////////////////////

    /// private helpers /////////////
    private makeUrl(func: string) {
        const urlbase: string = `http://${Config.frs.ip}:${Config.frs.port}/frs/cgi`;
        return `${urlbase}/${func}`;
    }
    private waitForLogin() {
        return this.sjLogined.filter(val => val === true).first().toPromise();
    }
    /////////////////////////////////
}

export default new FRSService();