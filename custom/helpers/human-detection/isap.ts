import * as Rx from 'rxjs';
import * as HttpClient from 'request';
import { Base } from './base';
import { Regex, Parser } from '../../helpers';

export class ISap {
    /**
     * Ken server config
     */
    private _config: ISap.IUrlConfig = undefined;
    public get config(): ISap.IUrlConfig {
        return JSON.parse(JSON.stringify(this._config));
    }
    public set config(value: ISap.IUrlConfig) {
        this._config = value;
    }

    /**
     * Target score
     */
    protected _score: number = 0.25;
    public get score(): number {
        return this._score;
    }
    public set score(value: number) {
        this._score = value;
    }

    /**
     * Ken server base url
     */
    private _baseUrl: string = '';
    public get baseUrl(): string {
        return this._baseUrl;
    }

    /**
     * Initialization flag
     */
    protected _isInitialization: boolean = false;
    public get isInitialization(): boolean {
        return this._isInitialization;
    }

    /**
     * Initialization device
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
     * Get human detection analysis
     */
    public async GetAnalysis(image: Buffer): Promise<Base.ILocation[]> {
        try {
            if (!this._isInitialization) {
                throw Base.Message.NotInitialization;
            }

            let url: string = `${this._baseUrl}/classification/human`;

            let result: ISap.IResponse = await new Promise<ISap.IResponse>((resolve, reject) => {
                try {
                    HttpClient.post(
                        {
                            url: url,
                            encoding: null,
                            json: true,
                            body: {
                                image64: image.toString(Parser.Encoding.base64),
                                target_score: this._score,
                            },
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
                            } else if (body.messsage.toLowerCase() !== 'ok') {
                                return reject(body.messsage);
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

            let hds: Base.ILocation[] = result.data.human_locations.map<Base.ILocation>((value, index, array) => {
                return {
                    score: Math.round(value.score * 100) / 100,
                    x: value.rectangle.x1,
                    y: value.rectangle.y1,
                    width: Math.abs(value.rectangle.x1 - value.rectangle.x2),
                    height: Math.abs(value.rectangle.y1 - value.rectangle.y2),
                };
            });

            return hds;
        } catch (e) {
            throw e;
        }
    }
}

export namespace ISap {
    /**
     *
     */
    export interface IUrlConfig {
        protocol: 'http' | 'https';
        ip: string;
        port: number;
    }

    /**
     *
     */
    export interface IResponse {
        messsage: string;
        data: IData;
    }

    /**
     *
     */
    export interface IData {
        target_score: number;
        human_locations: ILocation[];
    }

    /**
     *
     */
    export interface ILocation {
        score: number;
        rectangle: ISize;
    }

    /**
     *
     */
    export interface ISize {
        x1: number;
        y1: number;
        x2: number;
        y2: number;
    }
}
