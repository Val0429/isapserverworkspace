import * as HttpClient from 'request';
import { Print } from './';

export class Sgsms {
    /**
     * Config
     */
    private _config: Sgsms.IConfig = undefined;
    public get config(): Sgsms.IConfig {
        return JSON.parse(JSON.stringify(this._config));
    }
    public set config(value: Sgsms.IConfig) {
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
     * Initialization
     */
    public Initialization(): void {
        this._isInitialization = false;

        if (!this._config) {
            throw 'config is not setting';
        } else {
            if (!this._config.url) {
                throw 'url is undefined or empty';
            }
            if (!this._config.account) {
                throw 'account is undefined or empty';
            }
            if (!this._config.password) {
                throw 'password is undefined or empty';
            }
        }

        this._baseUrl = `${this._config.url}?username=${this._config.account}&password=${this._config.password}`;

        this._isInitialization = true;
    }

    /**
     * Send text message
     * @param from
     * @param message
     * @param to
     */
    public async Send(from: string, message: string, to: string): Promise<string> {
        try {
            if (!this._isInitialization) {
                throw 'not initialization';
            }

            from = encodeURIComponent(from);
            to = encodeURIComponent(to);
            message = encodeURIComponent(message);

            // https://mx.fortdigital.net/http/send-message?username=test60&password=test60&to=%2B886919901151&from=Min&message=Hi
            let url: string = `${this._baseUrl}&to=${to}&from=${from}&message=${message}`;

            let result: string = await new Promise<string>((resolve, reject) => {
                try {
                    HttpClient.get(
                        {
                            url: url,
                            encoding: null,
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
        } catch (e) {
            throw e;
        }
    }
}

export namespace Sgsms {
    export interface IConfig {
        url: string;
        account: string;
        password: string;
    }
}
