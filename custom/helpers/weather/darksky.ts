import * as HttpClient from 'request';
import { Base } from './base';

export class Darksky {
    /**
     * Secret Key
     */
    private _secretKey: string = '';
    public set secretKey(value: string) {
        this._secretKey = value;
    }
    public get secretKey(): string {
        return this._secretKey;
    }

    /**
     * Base url
     */
    private _baseUrl: string = 'https://api.darksky.net';

    /**
     * Initialization flag
     */
    private _isInitialization: boolean = false;
    public get isInitialization(): boolean {
        return this._isInitialization;
    }

    /**
     * Initialization
     */
    public Initialization(): void {
        this._isInitialization = false;
        this._isInitialization = true;
    }

    /**
     * Get current (℃)
     * @param latitude
     * @param longitude
     */
    public async GetCurrent(latitude: number, longitude: number): Promise<Darksky.IForecast_Currently> {
        try {
            if (!this._isInitialization) {
                throw Base.Message.NotInitialization;
            }

            let url: string = `${this._baseUrl}/forecast/${this._secretKey}/${latitude},${longitude}?exclude=minutely,hourly,daily,alerts,flags`;

            let result: any = await new Promise<any>((resolve, reject) => {
                try {
                    HttpClient.get(
                        {
                            url: url,
                            json: true,
                        },
                        (error, response, body) => {
                            if (error) {
                                return reject(error);
                            } else if ('error' in body) {
                                return reject(`${body.code}, ${body.error}`);
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

            return {
                latitude: result.latitude,
                longitude: result.longitude,
                timezone: result.timezone,
                currently: {
                    icon: result.currently.icon,
                    precipProbability: result.currently.precipProbability,
                    temperature: this.F2C(result.currently.temperature),
                    humidity: result.currently.humidity,
                    cloudCover: result.currently.cloudCover,
                    uvIndex: result.currently.uvIndex,
                    visibility: result.currently.visibility,
                },
            };
        } catch (e) {
            throw e;
        }
    }

    /**
     * Get daily (℃)
     * @param latitude
     * @param longitude
     */
    public async GetDay(latitude: number, longitude: number): Promise<Darksky.IForecast_Daily> {
        try {
            if (!this._isInitialization) {
                throw Base.Message.NotInitialization;
            }

            let url: string = `${this._baseUrl}/forecast/${this._secretKey}/${latitude},${longitude}?exclude=currently,minutely,hourly,alerts,flags`;

            let result: any = await new Promise<any>((resolve, reject) => {
                try {
                    HttpClient.get(
                        {
                            url: url,
                            json: true,
                        },
                        (error, response, body) => {
                            if (error) {
                                return reject(error);
                            } else if ('error' in body) {
                                return reject(`${body.code}, ${body.error}`);
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

            if (!result.daily.data[0]) {
                throw 'can not get daily data';
            }

            return {
                latitude: result.latitude,
                longitude: result.longitude,
                timezone: result.timezone,
                daily: {
                    icon: result.daily.data[0].icon,
                    precipProbability: result.daily.data[0].precipProbability,
                    temperatureMin: this.F2C(result.daily.data[0].temperatureMin),
                    temperatureMax: this.F2C(result.daily.data[0].temperatureMax),
                    humidity: result.daily.data[0].humidity,
                    cloudCover: result.daily.data[0].cloudCover,
                    uvIndex: result.daily.data[0].uvIndex,
                    visibility: result.daily.data[0].visibility,
                },
            };
        } catch (e) {
            throw e;
        }
    }

    /**
     * Convert ℉ to ℃
     */
    public F2C(temperature: number) {
        try {
            temperature = (5 / 9) * (temperature - 32);
            temperature = Math.round(temperature * 10) / 10;

            return temperature;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Convert ℃ to ℉
     */
    public C2F(temperature: number) {
        try {
            temperature = temperature * (9 / 5) + 32;
            temperature = Math.round(temperature * 10) / 10;

            return temperature;
        } catch (e) {
            throw e;
        }
    }
}

export namespace Darksky {
    /**
     *
     */
    export interface IForecast {
        latitude: number;
        longitude: number;
        timezone: string;
    }

    /**
     *
     */
    export interface IForecast_Currently extends IForecast {
        currently: ICurrently;
    }

    /**
     *
     */
    export interface IForecast_Daily extends IForecast {
        daily: IDaily;
    }

    /**
     *
     */
    export interface ICurrently {
        icon: string;
        precipProbability: number;
        temperature: number;
        humidity: number;
        cloudCover: number;
        uvIndex: number;
        visibility: number;
    }

    /**
     *
     */
    export interface IDaily {
        icon: string;
        precipProbability: number;
        temperatureMin: number;
        temperatureMax: number;
        humidity: number;
        cloudCover: number;
        uvIndex: number;
        visibility: number;
    }
}
