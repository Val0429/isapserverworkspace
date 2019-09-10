import { isNullOrUndefined } from "util";
import { ISuntecExt, ISignup, IRevoke } from './SuntecExt'
import { DateTime } from "../utilitys";

export class Suntec {
    //Singleton
    private static _instance: Suntec;

    public static getInstance(): Suntec {
        if (isNullOrUndefined(this._instance) === true) this._instance = new Suntec();
        return this._instance;
    }

    constructor() {
        this._request = require('request');
    }


    // public function
    private _connStr: string;
    private _token: string;
    private _request;

    public setConnection(ext: ISuntecExt) {
        this._connStr = `${ext.protocal}://${ext.host.replace('/', '')}/ver16/index.php/apicorporate`;
        this._token = ext.token;
    }

    public async signup(contect: ISignup) {
        let body = contect;
        body["SubtypeId"] = "1";     // 1: Staff, 2: Others
        body["PrivacyPolicy"] = "1"; // 1 : agree (cannot be 0 or others)

        var options = 
        {
            method: 'POST',
            url: `${this._connStr}/signup`,
            json:true,
            headers:
            {
                'cache-control': 'no-cache',
                'Content-Type': 'application/x-www-form-urlencoded',
                'token': this._token
            },
            form:
            {
                'params': JSON.stringify(body)
            }
        };

        return await new Promise((resolve, reject) => {
            this._request(options, function (error, response, body) {
                if (error) return reject(error);
                else if(body["StatusCode"] !== "200") reject(body["Message"]);

                return resolve(body)
            });
        });
    }

    public async revoke(contect: IRevoke) {
        let body = contect;
        body["TimeStamp"] = DateTime.ToString(new Date(),"YYYY-MM-DD HH:mm:ss");

        var options = 
        {
            method: 'POST',
            url: `${this._connStr}/revoke`,
            json:true,
            headers:
            {
                'cache-control': 'no-cache',
                'Content-Type': 'application/x-www-form-urlencoded',
                'token': this._token
            },
            form:
            {
                'params': JSON.stringify(body)
            }
        };

        return await new Promise((resolve, reject) => {
            this._request(options, function (error, response, body) {
                if (error) return reject(error);
                else if(body["StatusCode"] !== "200") reject(body["Message"]);

                return resolve(body)
            });
        });
    }
}