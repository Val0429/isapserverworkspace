import { Config } from 'core/config.gen';
import * as request from 'request';
import { Observable, BehaviorSubject, Subject, Observer } from 'rxjs';
import { Response } from '~express/lib/response';
import { Errors } from 'core/errors.gen';



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
                headers: { 'content-type': 'application/json' },
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
                headers: { 'content-type': 'application/json' },
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
    createGroup(name: string): Promise<GroupInfo> {
        const url = this.makeUrl("creategroup");
        return new Promise( async (resolve, reject) => {
            await this.waitForLogin();
            request({
                url,
                method: 'POST',
                json: true,
                headers: { 'content-type': 'application/json' },
                body: { session_id: this.sessionId, name, group_info: { actions: [] } }
            }, (err, res, body) => {
                if (err) {
                    console.log(`Create group failed. ${err}`);
                    reject(err); return;
                }
                resolve(body);
            });
        });
    }
    createPerson(name: string, image: string, employeeno?: string): Promise<ResponsePersonInfo> {
        const url = this.makeUrl("createperson");
        return new Promise( async (resolve, reject) => {
            await this.waitForLogin();
            request({
                url,
                method: 'POST',
                json: true,
                headers: { 'content-type': 'application/json' },
                body: {
                    session_id: this.sessionId,
                    person_info: {
                        fullname: name,
                        employeeno
                    },
                    image
                }
            }, (err, res, body) => {
                if (err) {
                    console.log(`Create person failed. ${err}`);
                    reject(err); return;
                }
                resolve(body);
            });
        });
    }
    applyGroupsToPerson(personId: string, groupId: string): Promise<any> {
        const url = this.makeUrl("applypersontogroups");
        return new Promise( async (resolve, reject) => {
            await this.waitForLogin();
            request({
                url,
                method: 'POST',
                json: true,
                headers: { 'content-type': 'application/json' },
                body: {
                    session_id: this.sessionId,
                    person_id: personId,
                    group_id_list: [ groupId ]
                }
            }, (err, res, body) => {
                if (err) {
                    console.log(`Apply groups to person failed. ${err}`);
                    reject(err); return;
                }
                resolve(body);
            });
        });
    }
    getPersonList(): Promise<PersonInfo[]> {
        const url = this.makeUrl("getpersonlist");
        return new Promise( async (resolve, reject) => {
            await this.waitForLogin();
            request({
                url,
                method: 'POST',
                json: true,
                headers: { 'content-type': 'application/json' },
                body: {
                    session_id: this.sessionId,
                    page_size: 999,
                    skip_pages: 0
                }
            }, (err, res, body) => {
                if (err) {
                    console.log(`Get person list failed. ${err}`);
                    reject(err); return;
                }
                if (body.message === 'Internal Server Error.') { reject(body.message); return; }
                resolve(body.person_list.persons);
            });
        });
    }
    deletePerson(personId: string): Promise<any> {
        const url = this.makeUrl("deleteperson");
        return new Promise( async (resolve, reject) => {
            await this.waitForLogin();
            request({
                url,
                method: 'POST',
                json: true,
                headers: { 'content-type': 'application/json' },
                body: {
                    session_id: this.sessionId,
                    person_id: personId
                }
            }, (err, res, body) => {
                if (err) {
                    console.log(`Delete person failed, ${err}`);
                    reject(err); return;
                }
                resolve(body);
            });
        });
    }
    /////////////////////////////////////////

    /// private functions ///////////////////
    private loggingIn: boolean = false;
    private maintainTimer: NodeJS.Timer = null;
    private login() {
        const url = this.makeCommonUrl("login");

        let tryLogin = () => {
            if (this.loggingIn === true) return;
            this.loggingIn = true;

            request({
                url, method: 'POST', json: true,
                headers: { 'content-type': 'application/json' },
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
                headers: { 'content-type': 'application/json' },
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
    private makeCommonUrl(func: string) {
        const urlbase: string = `http://${Config.frs.ip}:${Config.frs.port}/users/login`;
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
interface ResponsePersonInfo {
    person_id: string;
}
interface PersonInfo {
    person_info: {
        fullname: string;
    },
    person_id: string;
    groups: GroupInfo[];
}