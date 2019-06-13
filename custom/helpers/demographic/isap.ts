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
     * Target margin
     */
    protected _margin: number = 0.9;
    public get margin(): number {
        return this._margin;
    }
    public set margin(value: number) {
        this._margin = value;
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
     * Do demographic analysis
     */
    public async GetAnalysis(buffer: Buffer): Promise<ISap.IFeature> {
        try {
            if (!this._isInitialization) {
                throw Base.Message.NotInitialization;
            }

            let url: string = `${this._baseUrl}/demographic/ageGender`;

            let result: ISap.IResponse = await new Promise<ISap.IResponse>((resolve, reject) => {
                try {
                    HttpClient.post(
                        {
                            url: url,
                            json: true,
                            body: {
                                face_image64: buffer.toString(Parser.Encoding.base64),
                                margin: this._margin,
                            },
                        },
                        (error, response, body) => {
                            if (error) {
                                return reject(error);
                            } else if (response.statusCode !== 200) {
                                return reject(`${response.statusCode}, ${body.toString().replace(/(\r)?\n/g, '; ')}`);
                            } else if (body.message.toLowerCase() !== 'ok') {
                                return reject(body.message);
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

            let feature: ISap.IFeature = {
                age: result.age,
                gender: result.gender.toLowerCase(),
                buffer: buffer,
            };

            return feature;
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
    export interface IResponse extends IFeature {
        message: string;
    }

    /**
     *
     */
    export interface IFeature {
        age: number;
        gender: string;
        buffer: Buffer;
    }
}
