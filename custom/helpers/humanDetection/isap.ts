import * as HttpClient from 'request';
import { HumanDetection } from './';
import { Regex, Parser } from '../../helpers';

export class ISapHD {
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
            throw HumanDetection.Message.SettingIpError;
        }

        if (this._port === null || this._port === undefined || !Regex.IsNum(this._port.toString()) || this._port < 1 || this._port > 65535) {
            throw HumanDetection.Message.SettingPortError;
        }

        this._isInitialization = true;
    }

    /**
     * Do human detection analysis
     */
    public async Analysis(image: Buffer): Promise<HumanDetection.ILocation[]> {
        if (!this._isInitialization) {
            throw HumanDetection.Message.NotInitialization;
        }

        let url: string = `http://${this._ip}:${this._port}/classification/human`;

        let result: ISapHD.IResponse = await new Promise<ISapHD.IResponse>((resolve, reject) => {
            try {
                HttpClient(
                    {
                        url: url,
                        method: 'post',
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

        if (result.messsage.toLowerCase() !== 'ok') {
            throw result.messsage;
        }

        let hds: HumanDetection.ILocation[] = result.data.human_locations.map<HumanDetection.ILocation>((value, index, array) => {
            return {
                score: Math.round(value.score * 100) / 100,
                x: value.rectangle.x1,
                y: value.rectangle.y1,
                width: Math.abs(value.rectangle.x1 - value.rectangle.x2),
                height: Math.abs(value.rectangle.y1 - value.rectangle.y2),
            };
        });

        return hds;
    }
}

export namespace ISapHD {
    export interface IResponse {
        messsage: string;
        data: IData;
    }

    export interface IData {
        target_score: number;
        human_locations: ILocation[];
    }

    export interface ILocation {
        score: number;
        rectangle: ISize;
    }

    export interface ISize {
        x1: number;
        y1: number;
        x2: number;
        y2: number;
    }
}
