import { Config } from 'core/config.gen';
import * as request from 'request';
import { Observable, BehaviorSubject, Subject, Observer } from 'rxjs';
import { Response } from '~express/lib/response';


export class FRSService {
    private sessionId: string;
    private sjLogined: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

    constructor() {
        this.login();
    }

    /// public functions ////////////////////
    snapshot(image: string, resp: Response = null): Promise<string> {
        return new Promise<string>( async (resolve, reject) => {
            await this.waitForLogin();
            var url: string = this.makeUrl(`snapshot/session_id=${this.sessionId}&image=${image}`);
            request({
                url,
                method: 'GET',
                encoding: null
            }, (err, res, body) => {
                if (err) { reject(err); return; }
                if (resp !== null) {
                    resp.setHeader("content-type", res.headers["content-type"]);
                    resp.end(body, "binary");
                }
                resolve(body);
            });
        });
    }

    compareFace(image_1: string, image_2: string): Promise<number> {
        const url: string = this.makeUrl('compareface');
        return new Promise( async (resolve, reject) => {
            await this.waitForLogin();
            request({
                url,
                method: 'POST',
                json: true,
                body: { session_id: this.sessionId, image_1, image_2 }
            }, (err, res, body) => {
                if (err) {
                    console.log(`Compare face failed. ${err}`);
                    reject(err); return;
                }
                if (body.score === undefined) { reject(body); return; }
                resolve(body.score);
            });
        });
    }

    getGroupList(): Promise<GroupInfo[]> {
        const url = this.makeUrl("getgrouplist");
        return new Promise( async (resolve, reject) => {
            await this.waitForLogin();
            request({
                url,
                method: 'POST',
                json: true,
                body: { session_id: this.sessionId, page_size: 999, skip_pages: 0 }
            }, (err, res, body) => {
                if (err) {
                    console.log(`Get group list failed. ${err}`);
                    reject(err); return;
                }
                resolve(body.group_list.groups);
            });
        });
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
                //this.doWebsocketListen();
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
    /////////////////////////////////
}

export default new FRSService();


interface GroupInfo {
    name: string;
    group_id: string;
}