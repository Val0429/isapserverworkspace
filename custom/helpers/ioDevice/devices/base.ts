import * as Net from 'net';
import * as Dgram from 'dgram';
import { Regex, Print, Parser } from '../..';

export namespace Device {
    /**
     *
     */
    export enum Message {
        SettingPortError = 'Port should between 1 to 65535',
        SettingIpError = 'Illegal Ip format',
        SettingNameError = 'Device name should not empty',
        DeviceNotInitialization = 'Device is not initialization yet',
        DeviceDead = 'Device is dead',
        DeviceNotConnect = 'Device is not connect',
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
        keepAlive?: number;
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
        protected _client: Net.Socket | Dgram.Socket;

        protected _encoding: Parser.Encoding;
        protected _endChar: string;
        protected _connect: IConnect;
        protected _info: IInfo;
        protected _isInitializated: boolean;
        protected _aliveCount: number;
        protected _isTcp: boolean;

        protected _OnData = () => {
            this._aliveCount = 0;
        };

        /**
         * Get encoding
         */
        public get encoding() {
            return this._encoding;
        }

        /**
         * Get end char
         */
        public get endChar() {
            return this._endChar;
        }

        /**
         * Get connect data
         */
        public get connect() {
            return JSON.parse(JSON.stringify(this._connect));
        }

        /**
         * Get info data
         */
        public get info() {
            return JSON.parse(JSON.stringify(this._info));
        }

        /**
         * Get isInitializated flag
         */
        public get isInitializated() {
            return this._isInitializated;
        }

        /**
         *
         */
        constructor() {
            this._encoding = Parser.Encoding.utf8;
            this._endChar = '';
            this._isInitializated = false;
            this._aliveCount = 0;
            this._isTcp = false;
        }

        /**
         * initialization device
         * @param info
         * @param connect
         */
        public Initialization(info: IInfo, connect: IConnect): void {
            this._isInitializated = false;

            if (!Regex.IsIp(connect.ip)) {
                throw Message.SettingIpError;
            }
            if (!Regex.IsNum(connect.port.toString()) || connect.port < 1 || connect.port > 65535) {
                throw Message.SettingPortError;
            }
            if (info.name === '') {
                throw Message.SettingNameError;
            }

            if (connect.protocol === null || connect.protocol === undefined) {
                connect.protocol = 'tcp';
            }
            if (connect.keepAlive === null || connect.keepAlive === undefined) {
                connect.keepAlive = 10;
            }

            this._info = info;
            this._connect = connect;

            this._isTcp = this._connect.protocol === 'tcp';
            this._aliveCount = 0;

            if (this._isTcp) {
                (<Net.Socket>this._client) = new Net.Socket();

                (<Net.Socket>this._client).on('data', this._OnData);

                (<Net.Socket>this._client).on('connect', this.OnConnect);
                (<Net.Socket>this._client).on('data', this.OnData);
                (<Net.Socket>this._client).on('error', this.OnError);
                (<Net.Socket>this._client).on('close', this.OnClose);
            } else {
                (<Dgram.Socket>this._client) = Dgram.createSocket('udp4');

                (<Dgram.Socket>this._client).on('message', this._OnData);

                (<Dgram.Socket>this._client).on('listening', this.OnConnect);
                (<Dgram.Socket>this._client).on('message', this.OnData);
                (<Dgram.Socket>this._client).on('error', this.OnError);
                (<Dgram.Socket>this._client).on('close', this.OnClose);
            }

            this._isInitializated = true;
        }

        /**
         * Connect device
         */
        public async Connect(): Promise<void> {
            if (!this._isInitializated) {
                throw Message.DeviceNotInitialization;
            }

            await new Promise((resolve, reject) => {
                try {
                    if (this._isTcp) {
                        (<Net.Socket>this._client).once('connect', (): void => resolve());
                        (<Net.Socket>this._client).connect(
                            this._connect.port,
                            this._connect.ip,
                        );
                    } else {
                        this.Initialization(this._info, this._connect);
                        resolve();
                    }
                } catch (e) {
                    this.EmitError(e);
                }
            });
        }

        /**
         * Desconnect device
         */
        public async Disconnect(): Promise<void> {
            await new Promise((resolve, reject) => {
                try {
                    if (this._isTcp) {
                        (<Net.Socket>this._client).once('close', (): void => resolve());
                        (<Net.Socket>this._client).end();
                    } else {
                        (<Dgram.Socket>this._client).once('close', (): void => resolve());
                        (<Dgram.Socket>this._client).close();
                    }
                } catch (e) {
                    this.EmitError(e);
                }
            });
        }

        /**
         * Write message to device
         * @param message
         */
        public async Write(message: string): Promise<void> {
            let buffer: Buffer = Buffer.from(`${message}${this._endChar}`, this._encoding);

            await new Promise((resolve, reject) => {
                try {
                    if (this._aliveCount++ > this._connect.keepAlive) {
                        throw new Error(Message.DeviceDead);
                    }

                    if (this._isTcp) {
                        (<Net.Socket>this._client).once('data', () => resolve());
                        (<Net.Socket>this._client).write(buffer);
                    } else {
                        (<Dgram.Socket>this._client).once('message', () => resolve());
                        (<Dgram.Socket>this._client).send(buffer, this._connect.port, this._connect.ip);
                    }
                } catch (e) {
                    this.EmitError(e);
                }
            });
        }

        /**
         *
         * @param e
         */
        protected EmitError(e: Error) {
            if (this._isTcp) {
                (<Net.Socket>this._client).emit('error', e);
            } else {
                (<Dgram.Socket>this._client).emit('error', e);
            }
        }

        /**
         * Event "Connect" | "listening"
         */
        public OnConnect = (): void => {
            Print.MinLog(`${this._connect.ip}:${this._connect.port}: Connect`, 'warning');
        };

        /**
         * Event "Data" | "Message"
         * @param buffer
         */
        public OnData = (buffer: Buffer): void => {
            let message: string = buffer
                .toString(this._encoding)
                .replace(/\n/g, ',')
                .replace(/,$/, '');
            Print.MinLog(`${this._connect.ip}:${this._connect.port}: ${message}`, 'message');
        };

        /**
         * Event "Error"
         * @param e
         */
        public OnError = (e: Error): void => {
            Print.MinLog(`${this._connect.ip}:${this._connect.port}: Error ${e.message}`, 'error');
        };

        /**
         * Event "Close"
         */
        public OnClose = (): void => {
            Print.MinLog(`${this._connect.ip}:${this._connect.port}: Close`, 'warning');
        };
    }
}
