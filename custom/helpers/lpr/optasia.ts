import * as Dgram from 'dgram';
import * as Rx from 'rxjs';
import * as HttpClient from 'request';
import {} from '../../models';
import { Regex } from '../';
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
            if (!this._config.broadcastIp || !Regex.IsIp(this._config.broadcastIp)) {
                throw Base.Message.SettingIpError;
            }
            if (!this._config.broadcastPort || !Regex.IsPort(this._config.broadcastPort.toString())) {
                throw Base.Message.SettingPortError;
            }
        }

        this._isInitialization = true;
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
    export interface IResult {}
}
