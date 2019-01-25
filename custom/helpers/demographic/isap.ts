import * as HttpClient from 'request';
import { Demographic } from './';
import { Regex, Parser } from '../../helpers';
import { Print } from '../utilitys';

export class ISapDemo {
    /**
     * Ken server ip
     */
    protected _ip: string;
    public get ip(): string {
        return this._ip;
    }
    public set ip(value: string) {
        this._ip = value;
    }

    /**
     * Ken server port
     */
    protected _port: number;
    public get port(): number {
        return this._port;
    }
    public set port(value: number) {
        this._port = value;
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

        if (this._ip === null || this._ip === undefined || !Regex.IsIp(this._ip)) {
            throw Demographic.Message.SettingIpError;
        }

        if (this._port === null || this._port === undefined || !Regex.IsNum(this._port.toString()) || this._port < 1 || this._port > 65535) {
            throw Demographic.Message.SettingPortError;
        }

        this._isInitialization = true;
    }

    /**
     * Do demographic analysis
     */
    public async Analysis(image: Buffer): Promise<ISapDemo.IFeature> {
        if (!this._isInitialization) {
            throw Demographic.Message.NotInitialization;
        }

        let url: string = `http://${this._ip}:${this._port}/demographic/ageGender`;

        let result: ISapDemo.IResponse = await new Promise<ISapDemo.IResponse>((resolve, reject) => {
            try {
                HttpClient(
                    {
                        url: url,
                        method: 'post',
                        encoding: null,
                        json: true,
                        body: {
                            face_image64: image.toString(Parser.Encoding.base64),
                            margin: this._margin,
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

        if (result.message.toLowerCase() !== 'ok') {
            throw result.message;
        }

        Print.MinLog(JSON.stringify(result));

        let feature: ISapDemo.IFeature = {
            age: result.age,
            gender: result.gender,
        };

        return feature;
    }
}

export namespace ISapDemo {
    export interface IResponse extends IFeature {
        message: string;
    }

    export interface IFeature {
        age: number;
        gender: string;
    }
}
