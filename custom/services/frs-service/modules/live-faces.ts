import { Response } from '~express/lib/response';
import { FRSService } from './../index';
import * as request from 'request';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { RecognizedUser, UnRecognizedUser, UserType } from '../libs/core';
import { client } from 'websocket';
import { Log } from 'helpers/utility';
//import { filterFace } from '../libs/filter-face';


declare module "workspace/custom/services/frs-service" {
    interface FRSService {
        websocketInited: boolean;
        sjRecognizedUser: Subject<RecognizedUser>;
        sjUnRecognizedUser: Subject<UnRecognizedUser>;
        /// face stream from two web sockets
        sjLiveStream: Subject<RecognizedUser | UnRecognizedUser>;
        /// calculated face from face stream (handled)
        sjLiveHandledFace: Subject<RecognizedUser | UnRecognizedUser>;
        
        enableLiveFaces(enable: boolean): Promise<void>;
    }
}


FRSService.prototype.enableLiveFaces = async function(enable: boolean): Promise<void> {
    let { ip, wsport } = this.config.frs;
    return new Promise<void>( async (resolve) => {
        /// init properties /////
        if (this.websocketInited === undefined) this.websocketInited = false;
        if (this.sjRecognizedUser === undefined) this.sjRecognizedUser = new Subject<RecognizedUser>();
        if (this.sjUnRecognizedUser === undefined) this.sjRecognizedUser = new Subject<UnRecognizedUser>();
        if (this.sjLiveStream === undefined) this.sjLiveStream = new Subject<RecognizedUser | UnRecognizedUser>();
        if (this.sjLiveHandledFace === undefined) this.sjLiveHandledFace = new Subject<RecognizedUser | UnRecognizedUser>();
        /////////////////////////

        let makeConnection = (url: string, callback: (data: any) => void) => {
            let cli = new client();
            let timer;
            let reconnect = () => {
                timer && clearTimeout(timer);
                timer = setTimeout( () => makeConnection.call(this, url, callback), 1000 );
            }

            cli.on('connect', (connection) => {
                connection.on('error', (err) => {
                    Log.Error("FRS Server", `Websocket connection error. ${err}`);
                    reconnect();
                });
                connection.on('close', () => {
                    Log.Info("FRS Server", `Websocket connection closed.`);
                    reconnect();
                });
                connection.on('message', (message) => {
                    var data = eval(`(${message.utf8Data})`);
                    let code = (<any>data).code;
                    if (code) {
                        if (code === 200) return;
                        if (code === 401) {
                            Log.Error("FRS Server", `Websocket message error, data: ${data}`);
                            this.login();
                            return;
                        }
                        Log.Error("FRS Server", `Websocket error, data: ${data}`);
                        return;
                    }
                    callback && callback(data);
                });
                connection.sendUTF(JSON.stringify({
                    "session_id": this.sessionId
                }));
            });
            cli.on('connectFailed', (err) => {
                Log.Error("FRS Server", `Websocket connect failed. ${err}`);
                setTimeout( () => reconnect() );
            });
            cli.connect(url, 'echo-protocol');
        }

        await this.waitForLogin();
        const url: string = `ws://${ip}:${wsport}/frs/ws/fcsreconizedresult`;
        const urlnon: string = `ws://${ip}:${wsport}/frs/ws/fcsnonreconizedresult`;
        makeConnection.call(this, url, (data: RecognizedUser) => {
            // console.log('recognized result', data);
            this.sjRecognizedUser.next({type: UserType.Recognized, ...data});
        });
        makeConnection.call(this, urlnon, (data: UnRecognizedUser) => {
            // console.log('unrecognized result', data);
            this.sjUnRecognizedUser.next({type: UserType.UnRecognized, ...data});
        });

        // /// init main stream - to sjLiveStream
        // Observable.merge(this.sjRecognizedUser, this.sjUnRecognizedUser)
        //     .subscribe( this.sjLiveStream );
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
        
    } );
}
