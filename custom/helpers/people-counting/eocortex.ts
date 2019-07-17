import * as Rx from 'rxjs';
import * as Crypto from 'crypto';
import * as HttpClient from 'request';
import * as Xml2Js from 'xml2js';
import { Regex, DateTime } from '../';
import { Base } from './base';
import { Print } from '../utilitys';

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
     * Password
     */
    private _password: string = '';

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
    private _liveStream$: Rx.Subject<Eocortex.ILiveStream> = new Rx.Subject();
    public get liveStream$(): Rx.Subject<Eocortex.ILiveStream> {
        return this._liveStream$;
    }

    /**
     * Live stream catch
     */
    private _liveStreamCatch$: Rx.Subject<string> = new Rx.Subject();
    public get liveStreamCatch$(): Rx.Subject<string> {
        return this._liveStreamCatch$;
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
        this._password = password;
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
     * Get People Counting data
     * @param channelId
     * @param date
     */
    public async GetPeopleCounting(channelId: string, date: Date = new Date()): Promise<Eocortex.ICount> {
        try {
            let url: string = `${this._baseUrl}/xml`;

            let result: Eocortex.ICount = await new Promise<Eocortex.ICount>((resolve, reject) => {
                try {
                    HttpClient.get(
                        {
                            url: url,
                            encoding: null,
                            body: `<?xml version="1.0" encoding="utf-8" ?>
                                <query>
                                    <server_login>${this._config.account}</server_login>
                                    <server_pass_hash>${this._password}</server_pass_hash>
                                    <query_name>get_people_counters</query_name>
                                    <query_params>
                                        <channel_id>${channelId}</channel_id>
                                        <search_time>${DateTime.ToString(date, 'YYYY-MM-DD HH:mm:ss')}</search_time>
                                    </query_params>
                                </query>`,
                        },
                        async (error, response, body) => {
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

                            let parser = new Xml2Js.Parser();
                            let result: any = await new Promise((resolve, reject) => {
                                parser.parseString(body, function(err, value) {
                                    if (err) {
                                        return reject(err);
                                    }

                                    resolve(value);
                                });
                            });

                            if (result.result.query_result.indexOf('Error') > -1) {
                                return reject(result.result.query_msg.join(', '));
                            }

                            resolve({
                                in: result.result.in[0] || 0,
                                out: result.result.out[0] || 0,
                            });
                        },
                    );
                } catch (e) {
                    return reject(e);
                }
            }).catch((e) => {
                throw e;
            });

            return result;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Enable Live Subject
     * @param delayMilliSecond
     * @param intervalMilliSecond
     * @param bufferCount
     * @param channelIds
     */
    public EnableLiveSubject(delayMilliSecond: number, intervalMilliSecond: number, bufferCount: number, channelIds: string[]): void {
        if (!this._isInitialization) {
            throw Base.Message.NotInitialization;
        }

        this._liveStreamStop$.subscribe({
            next: () => {
                this._liveStream$.complete();
                this._liveStreamCatch$.complete();
                this._liveStreamStop$.complete();
            },
        });

        this._liveStream$ = new Rx.Subject();

        let next$: Rx.Subject<{}> = new Rx.Subject();
        let queue$: Rx.Subject<{ channelId: string; date: Date }> = new Rx.Subject();
        queue$
            .buffer(queue$.bufferCount(bufferCount).merge(Rx.Observable.interval(1000)))
            .zip(next$.startWith(0))
            .map((x) => {
                return x[0];
            })
            .subscribe({
                next: async (x) => {
                    try {
                        await Promise.all(
                            x.map(async (value, index, array) => {
                                try {
                                    let count: Eocortex.ICount = await this.GetPeopleCounting(value.channelId, value.date);

                                    this._liveStream$.next({
                                        ...value,
                                        ...count,
                                    });
                                } catch (e) {
                                    this._liveStreamCatch$.next(`Id: ${value.channelId}, ${e}`);
                                }
                            }),
                        ).catch((e) => {
                            throw e;
                        });
                    } catch (e) {
                        this._liveStreamCatch$.next(e);
                    }

                    next$.next();
                },
                error: (e) => {
                    this._liveStream$.error(e);
                },
                complete: () => {
                    this._liveStream$.complete();
                },
            });

        Rx.Observable.interval(intervalMilliSecond)
            .startWith(0)
            .delay(delayMilliSecond)
            .takeUntil(this._liveStreamStop$)
            .subscribe({
                next: (x) => {
                    let now: Date = new Date();
                    let date: Date = new Date(now.setMilliseconds(0));

                    channelIds.forEach((value, index, array) => {
                        queue$.next({ channelId: value, date: date });
                    });
                },
                error: (e) => {
                    this._liveStream$.error(e);
                },
                complete: () => {
                    this._liveStream$.complete();
                },
            });
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

    /**
     *
     */
    export interface ICount {
        in: number;
        out: number;
    }

    /**
     *
     */
    export interface ILiveStream extends ICount {
        channelId: string;
        date: Date;
    }
}
