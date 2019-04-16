import * as Rx from 'rxjs';
import * as HttpClient from 'request';
import {} from '../../models';
import { Regex, Print } from '../';
import { Base } from './base';

export class CMSService {
    /**
     * Config
     */
    private _config: CMSService.IConfig = undefined;
    public get config(): CMSService.IConfig {
        return JSON.parse(JSON.stringify(this._config));
    }
    public set config(value: CMSService.IConfig) {
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
     * Initialization flag
     */
    private _isInitialization: boolean = false;
    public get isInitialization(): boolean {
        return this._isInitialization;
    }

    /**
     * Live stream
     */
    private _liveStream$: Rx.Subject<CMSService.ISnapshot> = new Rx.Subject();
    public get liveStream$(): Rx.Subject<CMSService.ISnapshot> {
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
            if (!this._config.port || !Regex.IsNum(this._config.port.toString()) || this._config.port < 1 || this._config.port > 65535) {
                throw Base.Message.SettingPortError;
            }
        }

        this._baseUrl = `${this._config.protocol}://${this._config.ip}:${this._config.port}`;

        this._isInitialization = true;
    }

    /**
     * Get snapshot from cms
     * @param nvr
     * @param channel
     */
    public async GetSnapshot(nvr: number, channel: number, timestamp?: number): Promise<Buffer> {
        try {
            // http://172.16.10.100:7000/cgi-bin/snapshot?nvr=nvr1&channel=channel2&source=backend&timestamp=1546582859401
            let url: string = `http://${this._config.ip}:${this._config.port}/cgi-bin/snapshot?nvr=nvr${nvr}&channel=channel${channel}`;
            url += timestamp ? `&source=backend&timestamp=${timestamp}` : '';

            let buffer: Buffer = await new Promise<Buffer>((resolve, reject) => {
                try {
                    HttpClient.get(
                        {
                            url: url,
                            encoding: null,
                            auth: {
                                user: this._config.account,
                                pass: this._config.password,
                            },
                        },
                        (error, response, body) => {
                            if (error) {
                                return reject(error);
                            } else if (response.statusCode !== 200) {
                                return reject(`${response.statusCode}, ${Buffer.from(body).toString()}`);
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

            return buffer;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Enable Live Subject
     */
    public EnableLiveSubject(intervalSecond: number, sources: CMSService.ISource[]): void {
        if (!this._isInitialization) {
            throw Base.Message.NotInitialization;
        }

        this._liveStream$ = new Rx.Subject();

        let next$: Rx.Subject<{}> = new Rx.Subject();
        let queue$: Rx.Subject<{ nvr: number; channel: number; timestamp: number }> = new Rx.Subject();
        queue$
            .zip(next$.startWith(0))
            .map((x) => {
                return x[0];
            })
            .subscribe({
                next: async (x) => {
                    try {
                        let image: Buffer = await this.GetSnapshot(x.nvr, x.channel, x.timestamp);

                        next$.next();

                        this._liveStream$.next({
                            nvr: x.nvr,
                            channel: x.channel,
                            image: image,
                            timestamp: x.timestamp,
                        });
                    } catch (e) {
                        this._liveStreamStop$.error(e);
                    }
                },
                error: (e) => {
                    this._liveStream$.error(e);
                },
                complete: () => {
                    this._liveStream$.complete();
                },
            });

        Rx.Observable.interval(intervalSecond)
            .startWith(0)
            .takeUntil(this._liveStreamStop$)
            .subscribe({
                next: (x) => {
                    let now: Date = new Date();
                    let timestamp: number = now.getTime();

                    sources.forEach((value, index, array) => {
                        value.channels.forEach((value1, index1, array1) => {
                            queue$.next({ nvr: value.nvr, channel: value1, timestamp: timestamp });
                        });
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

export namespace CMSService {
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
    export interface ISource {
        nvr: number;
        channels: number[];
    }

    /**
     *
     */
    export interface ISnapshot {
        nvr: number;
        channel: number;
        image: Buffer;
        timestamp: number;
    }
}
