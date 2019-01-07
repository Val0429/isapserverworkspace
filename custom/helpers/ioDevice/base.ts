import * as Net from 'net';
import * as Dgram from 'dgram';
import { Regex, Print, Parser } from '..';

/**
 *
 */
export class IoDevice {
    protected _client: Net.Socket | Dgram.Socket;

    /**
     * Device Ip
     */
    protected _ip: string;
    public get ip(): string {
        return this._ip;
    }
    public set ip(value: string) {
        this._ip = value;
    }

    /**
     * Device Port
     */
    protected _port: number;
    public get port(): number {
        return this._port;
    }
    public set port(value: number) {
        this._port = value;
    }

    /**
     * Device info
     */
    protected _info: IoDevice.IInfo;
    public get info(): IoDevice.IInfo {
        return JSON.parse(JSON.stringify(this._info));
    }
    public set info(value: IoDevice.IInfo) {
        this._info = value;
    }

    /**
     * Connect protocol
     */
    protected _protocol: 'tcp' | 'udp' = 'tcp';
    public get protocol(): 'tcp' | 'udp' {
        return this._protocol;
    }
    public set protocol(value: 'tcp' | 'udp') {
        this._protocol = value;
    }

    /**
     * Message encoding
     */
    protected _encoding: Parser.Encoding = Parser.Encoding.utf8;
    public get encoding(): Parser.Encoding {
        return this._encoding;
    }

    /**
     * Message start char
     */
    protected _startChar: string = '';
    public get startChar(): string {
        return this._startChar;
    }

    /**
     * Message end char
     */
    protected _endChar: string = '';
    public get endChar(): string {
        return this._endChar;
    }

    /**
     * Initialization flag
     */
    protected _isInitialization: boolean = false;
    public get isInitialization(): boolean {
        return this._isInitialization;
    }

    /**
     * Use keep alive mode
     */
    protected _keepAlive: boolean = false;

    /**
     * Keep alive count limit
     */
    protected _keepAliveLimit: number = 10;
    public get keepAliveLimit(): number {
        return this._keepAliveLimit;
    }
    public set keepAliveLimit(value: number) {
        this._keepAliveLimit = value;
    }

    /**
     * Keep alive count
     */
    protected _keepAliveCount: number = 0;

    /**
     * Initialization device
     */
    public Initialization(): void {
        this._isInitialization = false;
        this._keepAliveCount = 0;

        if (this._ip === null || this._ip === undefined || !Regex.IsIp(this._ip)) {
            throw IoDevice.Message.SettingIpError;
        }

        if (this._port === null || this._port === undefined || !Regex.IsNum(this._port.toString()) || this._port < 1 || this._port > 65535) {
            throw IoDevice.Message.SettingPortError;
        }

        if (this._protocol === 'tcp') {
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

        this._isInitialization = true;
    }

    /**
     * Connect device
     */
    public async Connect(): Promise<void> {
        if (!this._isInitialization) {
            throw IoDevice.Message.DeviceNotInitialization;
        }

        await new Promise((resolve, reject) => {
            try {
                if (this._protocol === 'tcp') {
                    (<Net.Socket>this._client).once('connect', (): void => resolve());
                    (<Net.Socket>this._client).connect(
                        this._port,
                        this._ip,
                    );
                } else {
                    this.Initialization();
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
        if (!this._isInitialization) {
            throw IoDevice.Message.DeviceNotInitialization;
        }

        await new Promise((resolve, reject) => {
            try {
                if (this._protocol === 'tcp') {
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
        if (!this._isInitialization) {
            throw IoDevice.Message.DeviceNotInitialization;
        }

        let buffer: Buffer = Buffer.from(`${this._startChar}${message}${this._endChar}`, this._encoding);

        await new Promise((resolve, reject) => {
            try {
                if (this._keepAlive) {
                    if (this._keepAliveCount++ > this._keepAliveLimit) {
                        throw new Error(IoDevice.Message.DeviceDead);
                    }

                    if (this._protocol === 'tcp') {
                        (<Net.Socket>this._client).once('data', () => resolve());
                        (<Net.Socket>this._client).write(buffer);
                    } else {
                        (<Dgram.Socket>this._client).once('message', () => resolve());
                        (<Dgram.Socket>this._client).send(buffer, this._port, this._ip);
                    }
                } else {
                    if (this._protocol === 'tcp') {
                        (<Net.Socket>this._client).write(buffer);
                        resolve();
                    } else {
                        (<Dgram.Socket>this._client).send(buffer, this._port, this._ip);
                        resolve();
                    }
                }
            } catch (e) {
                this.EmitError(e);
            }
        });
    }

    /**
     * Emit error
     * @param e
     */
    protected EmitError(e: Error): void {
        if (this._protocol === 'tcp') {
            (<Net.Socket>this._client).emit('error', e);
        } else {
            (<Dgram.Socket>this._client).emit('error', e);
        }
    }

    /**
     * Event "Connect" | "listening"
     */
    public OnConnect = (): void => {
        Print.MinLog(`${this._ip}:${this._port}: Connect`, 'warning');
    };

    /**
     * Event "Data" | "Message"
     */
    protected _OnData = (): void => {
        this._keepAliveCount = 0;
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
        Print.MinLog(`${this._ip}:${this._port}: ${message}`, 'message');
    };

    /**
     * Event "Error"
     * @param e
     */
    public OnError = (e: Error): void => {
        Print.MinLog(`${this._ip}:${this._port}: ${e.message}`, 'error');
    };

    /**
     * Event "Close"
     */
    public OnClose = (): void => {
        Print.MinLog(`${this._ip}:${this._port}: Close`, 'warning');
    };
}

export namespace IoDevice {
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
    export interface IInfo {
        id: number;
        name: string;
    }
}
