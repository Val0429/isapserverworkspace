import * as Net from 'net';
import { Regex, Print, Parser } from '../..';

export namespace Device {
    /**
     *
     */
    export enum Message {
        NotInitialization = 'Not initialization yet',
        SettingPortError = 'Port should between 1 to 65535',
        SettingIpError = 'Illegal Ip format',
        SettingNameError = 'Device name should not empty',
    }

    /**
     *
     */
    export enum Family {
        IPv4 = '4',
        IPv6 = '6',
    }

    /**
     *
     */
    export interface IConnect {
        ip: string;
        port: number;
        protocol?: 'tcp' | 'udp';
        family?: Family;
    }

    /**
     *
     */
    export interface IInfo {
        id: number;
        name: string;
        di?: number;
        do?: number;
    }

    /**
     *
     */
    export class Control {
        protected _client: Net.Socket;

        protected _encoding: Parser.Encoding = Parser.Encoding.utf8;
        protected _endChar: string = '';
        protected _deviceConnect: IConnect;
        protected _deviceInfo: IInfo;
        protected _isInitializated: boolean;
        protected _isConnected: boolean;
        protected _OnConnect = (): void => {
            this._isConnected = true;
        };
        protected _OnClose = (): void => {
            this._isConnected = false;
        };

        /**
         *
         */
        public get encoding() {
            return this._encoding;
        }

        /**
         *
         */
        public get endChar() {
            return this._endChar;
        }

        /**
         *
         */
        public get deviceConnect() {
            return JSON.parse(JSON.stringify(this._deviceConnect));
        }

        /**
         *
         */
        public get deviceInfo() {
            return JSON.parse(JSON.stringify(this._deviceInfo));
        }

        /**
         *
         */
        public get isInitializated() {
            return this._isInitializated;
        }

        /**
         *
         */
        public get isConnected() {
            return this._isConnected;
        }

        /**
         *
         * @param info
         * @param connect
         */
        public Initialization(info: IInfo, connect: IConnect): void {
            if (!Regex.IsIp(connect.ip)) {
                throw Message.SettingIpError;
            }
            if (!Regex.IsNum(connect.port.toString()) || connect.port < 1 || connect.port > 65535) {
                throw Message.SettingPortError;
            }
            if (info.name === '') {
                throw Message.SettingNameError;
            }

            this._client = new Net.Socket();

            this._client.setKeepAlive(true, 1);

            this._client.on('connect', this._OnConnect);
            this._client.on('close', this._OnClose);

            this._client.on('connect', this.OnConnect);
            this._client.on('data', this.OnData);
            this._client.on('error', this.OnError);
            this._client.on('close', this.OnClose);

            this._deviceInfo = info;
            this._deviceConnect = connect;

            this._isConnected = false;
            this._isInitializated = true;
        }

        /**
         *
         */
        public async Connect(): Promise<void> {
            if (!this._isInitializated) {
                throw Message.NotInitialization;
            }

            await new Promise((resolve, reject) => {
                this._client.once('connect', (): void => resolve());
                this._client.connect(
                    this._deviceConnect.port,
                    this._deviceConnect.ip,
                );
            });
        }

        /**
         *
         */
        public async Disconnect(): Promise<void> {
            await new Promise((resolve, reject) => {
                this._client.once('close', (): void => resolve());
                this._client.end();
            });
        }

        /**
         *
         * @param message
         */
        public async Write(message: string): Promise<void> {
            await new Promise((resolve, reject) => {
                this._client.once('data', () => resolve());
                this._client.write(`${message}${this._endChar}`, this._encoding);
            });
        }

        /**
         *
         */
        public OnConnect = (): void => {
            Print.MinLog(`${this._deviceConnect.ip}:${this._deviceConnect.port}: Connect`, 'warning');
        };

        /**
         *
         * @param data
         */
        public OnData = (buffer: Buffer): void => {
            let message: string = buffer
                .toString()
                .replace(/\n/g, ',')
                .replace(/,$/, '');
            Print.MinLog(`${this._deviceConnect.ip}:${this._deviceConnect.port}: ${message}`, 'message');
        };

        /**
         *
         * @param e
         */
        public OnError = (e: Error): void => {
            Print.MinLog(`${this._deviceConnect.ip}:${this._deviceConnect.port}: Error ${e.message}`, 'error');
        };

        /**
         *
         */
        public OnClose = (): void => {
            Print.MinLog(`${this._deviceConnect.ip}:${this._deviceConnect.port}: Close`, 'warning');
        };
    }
}
