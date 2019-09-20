import * as request from 'request';
import { BehaviorSubject, Observable, Subject } from "rxjs";
import { Log } from 'helpers/utility';
import { LogTitle, IFRSManagerServiceConfig, RequestLoginReason } from './libs/core';
import { Config } from 'core/config.gen';

/**
 * Submodules should take this into consideration:
 * 1) sjLogined
 * 2) sjStarted
 * 3) config.debug
 * 4) when request failed do retry
 * 5) timeout handle
 */

export class FRSManagerService {
    private sessionId: string;
    /// started or not
    private sjStarted: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    /// login or not
    private sjLogined: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    /// request for relogin
    private sjRequestLogin: Subject<RequestLoginReason> = new Subject<RequestLoginReason>();
    private config: IFRSManagerServiceConfig;
    static initializer: ((this: FRSManagerService) => void)[] = [];

    /// use for fixed config frs
    private static _sharedInstance: FRSManagerService;
    static sharedInstance(): FRSManagerService {
        if (this._sharedInstance) return this._sharedInstance;
        this._sharedInstance = new FRSManagerService({
            debug: true,
            frsManager: Config.frs
        });
        this._sharedInstance.start();
        return this._sharedInstance;
    }

    constructor(config: IFRSManagerServiceConfig) {
        this.config = config;
        /// initialize
        FRSManagerService.initializer.forEach( (init) => init.call(this) );

        this.sjRequestLogin.subscribe( (reason) => {
            if (this.config.debug) {
                switch (reason) {
                    case RequestLoginReason.SessionExpired:
                        Log.Error(LogTitle, `Session expired. Mostly because of being logout (with account <${this.config.frsManager.account}>).`);
                        break;
                    default:
                        Log.Error(LogTitle, "Request to login again. (Unknown Error)");
                        break;
                }
            }
            this.login();
        });
    }

    start() {
        this.config.debug && Log.Info(LogTitle, "Started.");
        this.sjStarted.next(true);
        this.login();
    }

    stop() {
        this.sjStarted.next(false);
        this.sjLogined.next(false);
        this.config.debug && Log.Info(LogTitle, "Stopped.");
    }

    /// private helpers /////////////////////
    private makeUrl(func: string) {
        let { ip, port } = this.config.frsManager;
        const urlbase: string = `http://${ip}:${port}`;
        return `${urlbase}/${func}`;
    }
    public waitForSubject(target: BehaviorSubject<boolean>): Promise<boolean> {
        return target.getValue() === true ? null :
            target.filter(val => val === true).first().toPromise();
    }
    public waitForLogin() {
        return this.waitForSubject(this.sjLogined);
    }
    
    /// private functions ///////////////////
    /// prevent multiple login process
    private sjLoggingIn: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    private maintainTimer: any = null;
    private login() {
        if (this.sjStarted.getValue() === false) return;
        const url = this.makeUrl("user/web/login");

        let tryLogin = () => {
            if (this.sjLoggingIn.getValue() === true || this.sjStarted.getValue() === false) return;
            this.sjLogined.next(false);
            this.sjLoggingIn.next(true);

            let { ip, port, account: username, password } = this.config.frsManager;

            request({
                url, method: 'POST', json: true,
                headers: { "content-type": "application/json" },
                body: { username, password }
            }, (err, res, body) => {
                this.sjLoggingIn.next(false);
                if (err) {
                    let started = this.sjStarted.getValue();
                    this.config.debug && Log.Error(LogTitle, `Login failed@${ip}:${port}. ${started ? "Retry in 1 second." : ""}`);
                    started && setTimeout(() => { tryLogin() }, 1000);
                    return;
                }
                this.config.debug && Log.Info(LogTitle, `Login into Server@${ip}:${port}.`);
                this.sessionId = body.sessionId;

                this.sjLogined.next(true);
            });
        }
        tryLogin();
    }
}

