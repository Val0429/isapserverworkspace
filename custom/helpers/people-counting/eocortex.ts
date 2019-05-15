import * as Rx from 'rxjs';
import * as Crypto from 'crypto';
import * as HttpClient from 'request';
import { IDB } from '../../models';
import { Regex, Print } from '../';
import { Base } from './base';

export class Eocortex {
    /**
     * Config
     */
    private _config: Eocortex.IConfig = undefined;
    public get config(): Eocortex.IConfig {
        return JSON.parse(JSON.stringify(this._config));
    }
    public set config(value: Eocortex.IConfig) {
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
     * Base url query
     */
    private _baseUrlQuery: string = '';

    /**
     * Initialization flag
     */
    private _isInitialization: boolean = false;
    public get isInitialization(): boolean {
        return this._isInitialization;
    }

    /**
     * Live stream
     */
    private _liveStream$: Rx.Subject<{}> = new Rx.Subject();
    public get liveStream$(): Rx.Subject<{}> {
        return this._liveStream$;
    }

    /**
     * Live stream stop
     */
    private _liveStreamStop$: Rx.Subject<{}> = new Rx.Subject();
    public get liveStreamStop$(): Rx.Subject<{}> {
        return this._liveStreamStop$;
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

        let password: string = Crypto.createHash('md5')
            .update(this._config.password)
            .digest('hex');
        this._baseUrlQuery = `login=${this._config.account}&password=${password}`;
        this._baseUrl = `${this._config.protocol}://${this._config.ip}:${this._config.port}`;

        this._isInitialization = true;
    }

    /**
     * Get device list
     */
    public async GetDeviceList(): Promise<Eocortex.IChannel[]> {
        try {
            let url: string = `${this._baseUrl}/configex?responseType=json&${this._baseUrlQuery}`;

            let result: Eocortex.IConfigex = await new Promise<Eocortex.IConfigex>((resolve, reject) => {
                try {
                    HttpClient.get(
                        {
                            url: url,
                            encoding: null,
                            json: true,
                        },
                        (error, response, body) => {
                            if (error) {
                                return reject(error);
                            } else if (response.statusCode !== 200) {
                                return reject(
                                    `${response.statusCode}, ${Buffer.from(body)
                                        .toString()
                                        .replace(/\r\n/g, '; ')
                                        .replace(/\n/g, '; ')}`,
                                );
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

            return result.Channels.map((value, index, array) => {
                return {
                    Id: value.Id,
                    Name: value.Name,
                };
            });
        } catch (e) {
            throw e;
        }
    }

    /**
     * Enable Live Subject
     */
    public EnableLiveSubject(intervalSecond: number): void {
        if (!this._isInitialization) {
            throw Base.Message.NotInitialization;
        }

        this._liveStream$ = new Rx.Subject();
    }
}

export namespace Eocortex {
    /**
     * Hanwha camera config
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
    export interface IChannel {
        Id: string;
        Name: string;
    }

    /**
     *
     */
    export interface IConfigex {
        Id: string;
        SenderId: string;
        RevNum: number;
        Timestamp: Date;
        XmlProtocolVersion: number;
        ServerVersion: string;
        Servers: [];
        Channels: IChannel[];
        RootSecObject: {};
        UserGroup: {};
        MobileServerInfo: {};
        RtspServerInfo: {};
    }
}
