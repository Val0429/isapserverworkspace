import * as Rx from 'rxjs';
import * as HttpClient from 'request';
import { IDB } from '../../models';
import { Regex, Print } from '../';
import { Base } from './base';

export class Hanwha {
    /**
     * Config
     */
    private _config: Hanwha.IConfig = undefined;
    public get config(): Hanwha.IConfig {
        return JSON.parse(JSON.stringify(this._config));
    }
    public set config(value: Hanwha.IConfig) {
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
    private _liveStream$: Rx.Subject<Hanwha.ICount[]> = new Rx.Subject();
    public get liveStream$(): Rx.Subject<Hanwha.ICount[]> {
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
     * Get device snapshot src
     * @param device
     */
    public GetSnapshotSrc(): string {
        if (!this._isInitialization) {
            throw Base.Message.NotInitialization;
        }

        let url: string = `${this._baseUrl}/stw-cgi/video.cgi?msubmenu=snapshot&action=view`;

        return url;
    }

    /**
     * Get device setting src
     */
    public GetSettingSrc(): string {
        if (!this._isInitialization) {
            throw Base.Message.NotInitialization;
        }

        let url: string = `${this._baseUrl}`;

        return url;
    }

    /**
     * Get device Do setting
     */
    public async GetDoSetting(): Promise<Hanwha.IAlarmOutput> {
        if (!this._isInitialization) {
            throw Base.Message.NotInitialization;
        }

        let url: string = `${this._baseUrl}/stw-cgi/io.cgi?msubmenu=alarmoutput&action=view`;

        let result: Hanwha.IAlarmOutput = await new Promise<Hanwha.IAlarmOutput>((resolve, reject) => {
            try {
                HttpClient.get(
                    {
                        url: url,
                        encoding: null,
                        json: true,
                        auth: {
                            username: this._config.account,
                            password: this._config.password,
                            sendImmediately: false,
                        },
                    },
                    (error, response, body) => {
                        if (error) {
                            return reject(error);
                        } else if (response.statusCode !== 200) {
                            return reject(`${response.statusCode}, ${response.statusMessage}`);
                        } else if (body.Error) {
                            return reject(body.Error.Details);
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

        return result;
    }

    /**
     * Control Do
     */
    public async ControlDo(doNumber: number, status: 'On' | 'Off'): Promise<string> {
        if (!this._isInitialization) {
            throw Base.Message.NotInitialization;
        }

        let url: string = `${this._baseUrl}/stw-cgi/io.cgi?msubmenu=alarmoutput&action=control&AlarmOutput.${doNumber}.State=${status}`;

        let result: string = await new Promise<string>((resolve, reject) => {
            try {
                HttpClient.get(
                    {
                        url: url,
                        encoding: null,
                        json: true,
                        auth: {
                            username: this._config.account,
                            password: this._config.password,
                            sendImmediately: false,
                        },
                    },
                    (error, response, body) => {
                        if (error) {
                            return reject(error);
                        } else if (response.statusCode !== 200) {
                            return reject(`${response.statusCode}, ${response.statusMessage}`);
                        } else if (body.Error) {
                            return reject(body.Error.Details);
                        }

                        resolve(body.Response);
                    },
                );
            } catch (e) {
                return reject(e);
            }
        }).catch((e) => {
            throw e;
        });

        return result;
    }

    /**
     * Get version
     */
    public async GetVersion(): Promise<string> {
        if (!this._isInitialization) {
            throw Base.Message.NotInitialization;
        }

        let url: string = `${this._baseUrl}/stw-cgi/system.cgi?msubmenu=deviceinfo&action=view`;

        let result: string = await new Promise<string>((resolve, reject) => {
            try {
                HttpClient.get(
                    {
                        url: url,
                        encoding: null,
                        json: true,
                        auth: {
                            username: this._config.account,
                            password: this._config.password,
                            sendImmediately: false,
                        },
                    },
                    (error, response, body) => {
                        if (error) {
                            return reject(error);
                        } else if (response.statusCode !== 200) {
                            return reject(`${response.statusCode}, ${response.statusMessage}`);
                        } else if (body.Error) {
                            return reject(body.Error.Details);
                        }

                        resolve(body.FirmwareVersion);
                    },
                );
            } catch (e) {
                return reject(e);
            }
        }).catch((e) => {
            throw e;
        });

        return result;
    }

    /**
     * Enable Live Subject
     */
    public EnableLiveSubject(intervalSecond: number): void {
        if (!this._isInitialization) {
            throw Base.Message.NotInitialization;
        }

        this._liveStream$ = new Rx.Subject();

        let url: string = `${this._baseUrl}/stw-cgi/eventsources.cgi?msubmenu=peoplecount&action=check`;

        let next$: Rx.Subject<{}> = new Rx.Subject();
        Rx.Observable.interval(intervalSecond)
            .startWith(0)
            .zip(next$.startWith(0))
            .takeUntil(this._liveStreamStop$)
            .subscribe({
                next: async (x) => {
                    try {
                        let result: Hanwha.IPeopleCount = await new Promise<Hanwha.IPeopleCount>((resolve, reject) => {
                            try {
                                HttpClient.get(
                                    {
                                        url: url,
                                        encoding: null,
                                        json: true,
                                        auth: {
                                            username: this._config.account,
                                            password: this._config.password,
                                            sendImmediately: false,
                                        },
                                    },
                                    (error, response, body) => {
                                        if (error) {
                                            return reject(error);
                                        } else if (response.statusCode !== 200) {
                                            return reject(`${response.statusCode}, ${response.statusMessage}`);
                                        } else if (body.Error) {
                                            return reject(body.Error.Details);
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

                        let count: Hanwha.ICount[] = [].concat(
                            ...result.PeopleCount.map((value, index, array) => {
                                return value.Lines.map((value1, index1, array1) => {
                                    return {
                                        in: value1.InCount,
                                        out: value1.OutCount,
                                    };
                                });
                            }),
                        );

                        this._liveStream$.next(count);
                        next$.next();
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
    }
}

export namespace Hanwha {
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
    export interface IPeopleCount {
        PeopleCount: {
            Lines: {
                LineIndex: number;
                Name: string;
                InCount: number;
                OutCount: number;
            }[];
        }[];
    }

    /**
     *
     */
    export interface IAlarmOutput {
        AlarmOutputs: {
            AlarmOutput: number;
            Type: string;
            IdleState: string;
            ManualDuration: string;
        }[];
    }

    /**
     *
     */
    export interface ICount {
        in: number;
        out: number;
    }
}
