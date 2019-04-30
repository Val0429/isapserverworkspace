import * as Dgram from 'dgram';
import * as Rx from 'rxjs';
import * as HttpClient from 'request';
import {} from '../../models';
import { Print, Regex, DateTime } from '../';
import { Base } from './base';

export class Optasia {
    /**
     * Config
     */
    private _config: Optasia.IConfig = undefined;
    public get config(): Optasia.IConfig {
        return JSON.parse(JSON.stringify(this._config));
    }
    public set config(value: Optasia.IConfig) {
        this._config = value;
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
    private _liveStream$: Rx.Subject<Optasia.IResult> = new Rx.Subject();
    public get liveStream$(): Rx.Subject<Optasia.IResult> {
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
            if (!this._config.broadcastIp || !Regex.IsIp(this._config.broadcastIp)) {
                throw Base.Message.SettingIpError;
            }
            if (!this._config.broadcastPort || !Regex.IsPort(this._config.broadcastPort.toString())) {
                throw Base.Message.SettingPortError;
            }
        }

        this._isInitialization = true;
    }

    /**
     * Enable Live Subject
     */
    public EnableLiveSubject(): void {
        if (!this._isInitialization) {
            throw Base.Message.NotInitialization;
        }

        this._liveStream$ = new Rx.Subject();
        this._liveStreamStop$ = new Rx.Subject();

        let client: Dgram.Socket = Dgram.createSocket({ type: 'udp4', reuseAddr: true });

        client.bind(this._config.broadcastPort);

        this._liveStreamStop$.subscribe({
            next: (x) => {
                client.dropMembership(this._config.broadcastIp);
                client.close();
            },
        });

        client.on('listening', () => {
            client.addMembership(this._config.broadcastIp);
            Print.Log(`${this._config.broadcastIp}:${this._config.broadcastPort} is listening`, new Error(), 'success');
        });
        client.on('message', (message) => {
            if (message && message.length > 0) {
                let result: string = message.toString();
                let results: string[] = result.split(/ *:{4}/g);

                if (results.length >= 3) {
                    this._liveStream$.next({
                        plateNo: results[0],
                        date: DateTime.ToDate(results[1], 'YYYY-MM-DD HH:mm:ss'),
                        stationId: parseInt(results[2].replace(/[^0-9]/g, '')),
                    });
                }
            }
        });
        client.on('error', (e) => {
            this._liveStream$.error(e);
        });
        client.on('close', () => {
            this._liveStream$.complete();
        });
    }
}

export namespace Optasia {
    /**
     *
     */
    export interface IConfig {
        broadcastIp: string;
        broadcastPort: number;
    }

    /**
     *
     */
    export interface IResult {
        plateNo: string;
        date: Date;
        stationId: number;
    }
}
