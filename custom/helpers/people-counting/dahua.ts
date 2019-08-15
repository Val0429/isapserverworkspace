import * as Rx from 'rxjs';
import * as HttpClient from 'request';
import { IDB } from '../../models';
import { Regex, Print } from '../';
import { Base } from './base';

export class Dahua {
    /**
     * Config
     */
    private _config: Dahua.IConfig = undefined;
    public get config(): Dahua.IConfig {
        return JSON.parse(JSON.stringify(this._config));
    }
    public set config(value: Dahua.IConfig) {
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
    private _liveStream$: Rx.Subject<Dahua.ICount> = new Rx.Subject();
    public get liveStream$(): Rx.Subject<Dahua.ICount> {
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
     * Get Summary
     */
    public async GetSummary(): Promise<Dahua.ICount> {
        if (!this._isInitialization) {
            throw Base.Message.NotInitialization;
        }

        let url: string = `${this._baseUrl}/cgi-bin/videoStatServer.cgi?action=getSummary&channel=1`;

        let result: string = await new Promise<string>((resolve, reject) => {
            try {
                HttpClient.get(
                    {
                        url: url,
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
                            return reject(`${response.statusCode}, ${(body || response.statusMessage).toString().replace(/(\r)?\n/g, '; ')}`);
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

        let Cut = (obj: object, keys: string[]) => {
            if (keys.length > 2) {
                if (!obj[keys[0]]) obj[keys[0]] = {};
                Cut(obj[keys[0]], keys.splice(1, keys.length - 1));
            } else {
                if (/[0-9]/.test(keys[1])) obj[keys[0]] = parseInt(keys[1]);
                else if (/true|false/.test(keys[1])) obj[keys[0]] = keys[1] === 'true';
                else obj[keys[0]] = keys[1];
            }
        };

        let strs: string[][] = result
            .split(/\r\n/)
            .filter((n) => !!n)
            .map((n) => n.split(/\.|=/).filter((n) => !!n));

        let obj: object = {};
        for (let i: number = 0; i < strs.length; i++) {
            Cut(obj, strs[i]);
        }

        let pc = obj as Dahua.IPeopleCount;

        return {
            in: pc.summary.EnteredSubtotal.Today,
            out: pc.summary.ExitedSubtotal.Today,
        };
    }

    /**
     * Enable Live Subject
     */
    public EnableLiveSubject(intervalSecond: number): void {
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

        let next$: Rx.Subject<{}> = new Rx.Subject();
        Rx.Observable.interval(intervalSecond)
            .startWith(0)
            .zip(next$.startWith(0))
            .takeUntil(this._liveStreamStop$)
            .subscribe({
                next: async (x) => {
                    try {
                        let count: Dahua.ICount = await this.GetSummary();

                        this._liveStream$.next(count);
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
    }
}

export namespace Dahua {
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
    export interface ISubtotal {
        Hour: number;
        Today: number;
        Total: number;
        TotalInTimeSection: number;
    }

    /**
     *
     */
    export interface IPeopleCount {
        summary: {
            Channel: number;
            EnteredSubtotal: ISubtotal;
            ExitedSubtotal: ISubtotal;
            InsideSubtotal: ISubtotal;
            RuleName: string;
            UTC: number;
        };
    }

    /**
     *
     */
    export interface ICount {
        in: number;
        out: number;
    }
}
