import { Response } from '~express/lib/response';
import { FRSService } from './../index';
import * as request from 'request';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { RecognizedUser, UnRecognizedUser, UserType, LogTitle, IFRSServiceConfig } from '../libs/core';
import { client } from 'websocket';
import { Log } from 'helpers/utility';
//import { filterFace } from '../libs/filter-face';

declare module "workspace/custom/services/frs-service/libs/core" {
    interface IFRSConfig {
        specialScoreForUnRecognizedFace?: number;
        throttleKeepSameFaceSeconds?: number;
    }
}

declare module "workspace/custom/services/frs-service" {
    interface FRSService {
        sjLiveFacesEnabled: BehaviorSubject<boolean>;
        sjRecognizedUser: Subject<RecognizedUser>;
        sjUnRecognizedUser: Subject<UnRecognizedUser>;
        /// face stream from two web sockets
        sjLiveStream: Subject<RecognizedUser | UnRecognizedUser>;
        /// calculated face from face stream (handled)
        sjLiveHandledFace: Subject<RecognizedUser | UnRecognizedUser>;
        
        enableLiveFaces(enable: boolean): Promise<void>;
    }
}

FRSService.initializer.push( function() {
    /// init properties /////
    this.sjLiveFacesEnabled = new BehaviorSubject<boolean>(false);
    this.sjRecognizedUser = new Subject<RecognizedUser>();
    this.sjUnRecognizedUser = new Subject<UnRecognizedUser>();
    this.sjLiveStream = new Subject<RecognizedUser | UnRecognizedUser>();
    this.sjLiveHandledFace = new Subject<RecognizedUser | UnRecognizedUser>();
    /////////////////////////
});

FRSService.prototype.enableLiveFaces = async function(enable: boolean) {
    /// ignore same value
    if (enable === this.sjLiveFacesEnabled.getValue()) return;
    this.sjLiveFacesEnabled.next(enable);
    /// disable handled at below (not here)
    if (!enable) return;

    let lfa = new LiveFacesAdapter(this.config, this);
    lfa.start();
    this.sjLiveFacesEnabled.filter( v => v === false )
        .first().toPromise()
        .then( () => lfa.stop() );
}

class LiveFacesAdapter {
    private config: IFRSServiceConfig;
    private frs: FRSService;
    private sjStarted: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    constructor(config: IFRSServiceConfig, frs: FRSService) {
        this.config = config;
        this.frs = frs;
    }
    start() {
        this.config.debug && Log.Info(LogTitle, "Live Faces Enabled.");
        this.sjStarted.next(true);
        this.do();
    }
    stop() {
        this.config.debug && Log.Info(LogTitle, "Live Faces Disabled.");
        this.sjStarted.next(false);
    }
    private async do() {
        let { ip, wsport } = this.config.frs;

        let makeConnection = (url: string, callback: (data: any) => void) => {
            /// to prevent call stop after login
            if (this.sjStarted.getValue() === false) return;

            let cli = new client();
            let timer;
            let reconnect = async () => {
                timer && clearTimeout(timer);
                if (this.sjStarted.getValue() === false) return;
                /// if trying to login (401 | 423 could be the case), hold on until login successful.
                await this.frs.waitForLogin();
                timer = setTimeout( () => makeConnection.call(this, url, callback), 1000 );
            }

            cli.on('connect', (connection) => {
                this.config.debug && Log.Info(LogTitle, `Live Faces Websocket Connected.`);

                this.sjStarted.subscribe( (started) => {
                    !started && connection.close();
                });

                connection.on('error', (err) => {
                    this.config.debug && Log.Error(LogTitle, `Live Faces Websocket Connection Error. ${JSON.stringify(err)}`);
                    reconnect();
                });
                connection.on('close', () => {
                    this.config.debug && this.sjStarted.getValue() === true && Log.Error(LogTitle, `Live Faces Websocket Connection Closed.`);
                    reconnect();
                });
                connection.on('message', (message) => {
                    if (this.sjStarted.getValue() === false) return;
                    var data = eval(`(${message.utf8Data})`);
                    let code = (<any>data).code;
                    if (code) {
                        if (code === 200) return;
                        if (code === 401 || code === 423) {
                            this.config.debug && Log.Error(LogTitle, `Live Faces Websocket Message Error, data: ${JSON.stringify(data)}`);
                            (this.frs as any).sjRequestLogin.next();
                            return;
                        }
                        this.config.debug && Log.Error(LogTitle, `Live Faces Websocket Other Error, data: ${JSON.stringify(data)}`);
                        return;
                    }
                    callback && callback(data);
                });
                connection.sendUTF(JSON.stringify({
                    "session_id": (this.frs as any).sessionId
                }));
            });
            cli.on('connectFailed', (err) => {
                this.config.debug && Log.Error(LogTitle, `Live Faces Websocket Connect Failed. ${JSON.stringify(err)}`);
                setTimeout( () => reconnect() );
            });
            cli.connect(url, 'echo-protocol');
        }

        await (this.frs as any).waitForLogin();
        if (this.sjStarted.getValue() === false) return;

        const url: string = `ws://${ip}:${wsport}/frs/ws/fcsreconizedresult`;
        const urlnon: string = `ws://${ip}:${wsport}/frs/ws/fcsnonreconizedresult`;
        makeConnection.call(this, url, (data: RecognizedUser) => {
            // console.log('recognized result', data);
            this.frs.sjRecognizedUser.next({type: UserType.Recognized, ...data});
        });
        makeConnection.call(this, urlnon, (data: UnRecognizedUser) => {
            // console.log('unrecognized result', data);
            this.frs.sjUnRecognizedUser.next({type: UserType.UnRecognized, ...data});
        });

        /// init main stream - to sjLiveStream
        Observable.merge(this.frs.sjRecognizedUser, this.frs.sjUnRecognizedUser)
            .subscribe( this.frs.sjLiveStream );
        // this.sjLiveStream.pipe( filterFace(this.config) )
        //     .subscribe( this.sjLiveFace );

        // let subscription = Observable.merge(this.sjRecognizedUser, this.sjUnRecognizedUser)
        //     .pipe( filterFace(this.config, async (compared) => {
        //         await this.waitForLogin();
        //         this.sjLiveHandledFace.next(compared);
        //     }) )
        //     .subscribe( this.sjLiveStream );

        //     /// init main stream
        //     this.livestream = Observable.merge(sjRecognizedUser, sjUnRecognizedUser)
        //         .pipe( filterFace( async (compared) => {
        //             await this.waitForRecover();
        //             await this.waitForLogin();
        //             this.sjLiveFace.next(compared);
        //         }) );        
    }
}