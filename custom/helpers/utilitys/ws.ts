import * as WebSocket from 'ws';
import * as Rx from 'rxjs';

export class Ws {
    /**
     *
     */
    private _websocket: WebSocket = undefined;

    /**
     *
     */
    private _isConnect: boolean = false;

    /**
     * Base url
     */
    private _url: string = '';
    public get url(): string {
        return this._url;
    }
    public set url(value: string) {
        this._url = value;
    }

    /**
     * On open subject
     */
    private _open$: Rx.Subject<{}> = new Rx.Subject();
    public get open$(): Rx.Subject<{}> {
        return this._open$;
    }

    /**
     * On message subject
     */
    private _message$: Rx.Subject<any> = new Rx.Subject();
    public get message$(): Rx.Subject<any> {
        return this._message$;
    }

    /**
     * On error subject
     */
    private _error$: Rx.Subject<Error> = new Rx.Subject();
    public get error$(): Rx.Subject<Error> {
        return this._error$;
    }

    /**
     * On close subject
     */
    private _close$: Rx.Subject<string> = new Rx.Subject();
    public get close$(): Rx.Subject<string> {
        return this._close$;
    }

    /**
     * Connect
     */
    public async Connect(): Promise<void> {
        try {
            await this.Close();

            await new Promise((resolve, reject) => {
                try {
                    this._websocket = new WebSocket(this._url);

                    this._websocket.on('open', () => {
                        this._isConnect = true;

                        this._open$.next();

                        resolve();
                    });

                    this._websocket.on('message', (data) => {
                        this._message$.next(data);
                    });

                    this._websocket.on('error', (e) => {
                        this._error$.next(e);
                    });

                    this._websocket.on('close', (code: number, message: string) => {
                        this._close$.next(`${code}, ${message}`);
                    });
                } catch (e) {
                    return reject(e);
                }
            }).catch((e) => {
                throw e;
            });
        } catch (e) {
            throw e;
        }
    }

    /**
     * Close
     */
    public async Close(): Promise<void> {
        try {
            if (this._websocket) {
                if (this._isConnect) {
                    await new Promise((resolve, reject) => {
                        try {
                            this._websocket.once('close', () => {
                                resolve();
                            });

                            this._websocket.close();
                        } catch (e) {
                            return reject(e);
                        }
                    });
                }

                this._websocket.removeAllListeners();
                this._websocket = undefined;
            }

            this._isConnect = false;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Send message
     * @param message
     */
    public Send(message: string): void {
        try {
            if (!this._isConnect) {
                throw `${this._url} was not connect`;
            }

            this._websocket.send(message);
        } catch (e) {
            throw e;
        }
    }
}

export namespace Ws {}
