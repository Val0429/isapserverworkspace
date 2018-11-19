import config from './../../config/custom/frs';
import * as request from 'request';
import * as http from 'http';
import { Log } from 'helpers/utility';

export class FRSService {
    session_id: string;
    constructor() {
        this.login();
    }

    private maintainInterval;
    login() {
        const url: string = `http://${config.ip}:${config.port}/frs/cgi/login`;

        var tryLogin = () => {
            request({
                url,
                method: 'POST',
                json: true,
                body: { username: config.account, password: config.password }
            }, (err, res, body) => {
                if (err || !body.session_id) {
                    Log.Error('FRS Server', `Login failed@${config.ip}:${config.port}. Retry in 1 second.`);
                    setTimeout(() => { tryLogin() }, 1000);
                    return;
                }
                Log.Info('FRS Server', `Login into Server@${config.ip}:${config.port}.`);
                this.session_id = body.session_id;
                /// After login and got session_id, maintain session every 1 minute.
                this.maintainInterval && clearInterval(this.maintainInterval);
                this.maintainInterval = setInterval( () => {
                    this.maintainSession();
                }, 60000);
            });
        }
        tryLogin();
    }
    
    maintainSession() {
        const url: string = `http://${config.ip}:${config.port}/frs/cgi/maintainsession`;
        request({
            url,
            method: 'POST',
            json: true,
            body: { session_id: this.session_id }
        }, (err, res, body) => {
            if (err) {
                Log.Error('FRS Server', `Maintain FRS session failed@${config.ip}:${config.port}.`);
                this.maintainInterval && clearInterval(this.maintainInterval);
                this.login();
            }
            // console.log('maintain success', body);
        });
    }

    compareFace(image_1: string, image_2: string): Promise<number> {
        const url: string = `http://${config.ip}:${config.port}/frs/cgi/compareface`;
        return new Promise((resolve, reject) => {
            request({
                url,
                method: 'POST',
                json: true,
                body: { session_id: this.session_id, image_1, image_2 }
            }, (err, res, body) => {
                if (err) {
                    Log.Error('FRS Server', `Compare face failed. ${err}`);
                    reject(err); return;
                }
                if (body.score === undefined) { reject(body); return; }
                resolve(body.score);
            });
        });
    }

}

export default new FRSService();