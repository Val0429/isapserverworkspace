import * as Rx from 'rxjs';
import * as HttpClient from 'request';
import {} from '../../models';
import { Regex } from '../';
import { Base } from './base';

export class VMS {
    /**
     * Config
     */
    private _config: VMS.IConfig = undefined;
    public get config(): VMS.IConfig {
        return JSON.parse(JSON.stringify(this._config));
    }
    public set config(value: VMS.IConfig) {
        this._config = value;
    }

    /**
     * Base url
     */
    private _baseUrl: string = '';
    public get baseUrl(): string {
        return this._baseUrl;
    }

    /**
     * Session id
     */
    private _sessionId: string = '';
    public get sessionId(): string {
        return this._sessionId;
    }

    /**
     * Initialization flag
     */
    private _isInitialization: boolean = false;
    public get isInitialization(): boolean {
        return this._isInitialization;
    }

    /**
     * Initialization
     */
    public Initialization(): void {
        this._isInitialization = false;

        if (!this._config) {
            throw Base.Message.ConfigNotSetting;
        } else {
            if (!this._config.ip || !Regex.IsIp(this._config.ip)) {
                throw Base.Message.SettingIpError;
            }
            if (!this._config.port || !Regex.IsPort(this._config.port.toString())) {
                throw Base.Message.SettingPortError;
            }
        }

        this._baseUrl = `${this._config.protocol}://${this._config.ip}:${this._config.port}`;

        this._isInitialization = true;
    }

    /**
     * Login
     */
    public async Login(): Promise<string> {
        try {
            let url: string = `${this._baseUrl}/users/login`;

            let result: VMS.ILoginResponse = await new Promise<VMS.ILoginResponse>((resolve, reject) => {
                try {
                    HttpClient.post(
                        {
                            url: url,
                            json: true,
                            body: {
                                username: this._config.account,
                                password: this._config.password,
                            },
                        },
                        (error, response, body) => {
                            if (error) {
                                return reject(error);
                            } else if (response.statusCode !== 200) {
                                return reject(`${response.statusCode}, ${body.toString().replace(/(\r)?\n/g, '; ')}`);
                            }

                            resolve(body);
                        },
                    );
                } catch (e) {
                    return reject(e);
                }
            }).catch((e) => {
                throw e;
            });

            this._sessionId = result.sessionId;

            return result.sessionId;
        } catch (e) {
            throw e;
        }
    }
}

export namespace VMS {
    /**
     *
     */
    export interface IConfig {
        protocol: 'http' | 'https';
        ip: string;
        port: number;
        account: string;
        password: string;
    }

    /**
     *
     */
    export interface ILoginResponse {
        sessionId: string;
    }
}
