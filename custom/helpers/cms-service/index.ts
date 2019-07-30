import * as Rx from 'rxjs';
import * as HttpClient from 'request';
import * as Xml2Js from 'xml2js';
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
            let url: string = `${this._baseUrl}/cgi-bin/snapshot?nvr=nvr${nvr}&channel=channel${channel}`;
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

            return buffer;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Get device tree
     */
    public async GetDeviceTree(): Promise<CMSService.INvr[]> {
        try {
            let url: string = `${this._baseUrl}/cgi-bin/nvrconfig?action=loadalldevice`;

            let result: any = await new Promise<any>((resolve, reject) => {
                try {
                    HttpClient.get(
                        {
                            url: url,
                            json: true,
                            auth: {
                                user: this._config.account,
                                pass: this._config.password,
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

            let parser = new Xml2Js.Parser();
            let devices: any = await new Promise((resolve, reject) => {
                parser.parseString(result, function(err, value) {
                    if (err) {
                        return reject(err);
                    }

                    resolve(value);
                });
            });

            let nvrs: CMSService.INvr[] = devices.AllNVR.NVR.map((value, index, array) => {
                let channels: CMSService.IChannel = value.AllDevices[0].DeviceConnectorConfiguration;

                if (!channels) {
                    return;
                }

                return {
                    nvrId: parseInt(value.$.id),
                    channels: value.AllDevices[0].DeviceConnectorConfiguration.map((value1, index1, array1) => {
                        return {
                            name: value1.$.name,
                            channelId: parseInt(value1.DeviceID[0]),
                        };
                    }),
                };
            }).filter((value, index, array) => {
                return value;
            });

            return nvrs;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Get device list
     */
    public async GetDeviceList(): Promise<CMSService.IDevice[]> {
        try {
            let nvrs = await this.GetDeviceTree();

            let list: CMSService.IDevice[] = [].concat(
                ...nvrs.map((value, index, array) => {
                    return value.channels.map((value1, index1, array1) => {
                        return {
                            name: value1.name,
                            nvrId: value.nvrId,
                            channelId: value1.channelId,
                        };
                    });
                }),
            );

            return list;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Enable Live Subject
     * @param delayMilliSecond
     * @param intervalMilliSecond
     * @param bufferCount
     * @param sources
     * @param isLive
     */
    public EnableLiveSubject(delayMilliSecond: number, intervalMilliSecond: number, bufferCount: number, sources: CMSService.ISource[], isLive: boolean): void {
        if (!this._isInitialization) {
            throw Base.Message.NotInitialization;
        }

        this._liveStream$ = new Rx.Subject();
        this._liveStreamCatch$ = new Rx.Subject();
        this._liveStreamStop$ = new Rx.Subject();

        this._liveStreamStop$.subscribe({
            next: () => {
                this._liveStream$.complete();
                this._liveStreamCatch$.complete();
                this._liveStreamStop$.complete();
            },
        });

        this._liveStream$ = new Rx.Subject();

        let next$: Rx.Subject<{}> = new Rx.Subject();
        let queue$: Rx.Subject<{ nvr: number; channel: number; timestamp: number }> = new Rx.Subject();
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
                                    let image: Buffer = isLive ? await this.GetSnapshot(value.nvr, value.channel) : await this.GetSnapshot(value.nvr, value.channel, value.timestamp);

                                    this._liveStream$.next({
                                        nvr: value.nvr,
                                        channel: value.channel,
                                        image: image,
                                        timestamp: value.timestamp,
                                    });
                                } catch (e) {
                                    this._liveStreamCatch$.next(`Nvr: ${value.nvr}, Channel: ${value.channel}, ${e}`);
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
                    let timestamp: number = now.setSeconds(0, 0);

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

    /**
     *
     */
    export interface INvr {
        nvrId: number;
        channels: IChannel[];
    }

    /**
     *
     */
    export interface IChannel {
        channelId: number;
        name: string;
    }

    /**
     *
     */
    export interface IDevice {
        name: string;
        nvrId: number;
        channelId: number;
    }
}
