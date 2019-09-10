import * as Rx from 'rxjs';
import * as HttpClient from 'request';
import {} from '../../models';
import { Regex, Ws, Utility } from '../';
import { Base } from './base';
import { FRSCore } from './frs-service';
import * as Enum from '../../enums';

export class FRS {
    /**
     * Config
     */
    private _config: FRS.IConfig = undefined;
    public get config(): FRS.IConfig {
        return JSON.parse(JSON.stringify(this._config));
    }
    public set config(value: FRS.IConfig) {
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
     * Base ws url
     */
    private _baseWsUrl: string = '';
    public get baseWsUrl(): string {
        return this._baseWsUrl;
    }

    /**
     * Session id
     */
    private _sessionId: string = '';
    public get sessionId(): string {
        return this._sessionId;
    }

    /**
     * Initialization flag
     */
    private _isInitialization: boolean = false;
    public get isInitialization(): boolean {
        return this._isInitialization;
    }

    /**
     * Live stream
     */
    private _liveStream$: Rx.Subject<FRS.IResult> = new Rx.Subject();
    public get liveStream$(): Rx.Subject<FRS.IResult> {
        return this._liveStream$;
    }

    /**
     * Live stream catch
     */
    private _liveStreamClose$: Rx.Subject<{}> = new Rx.Subject();
    public get liveStreamClose$(): Rx.Subject<{}> {
        return this._liveStreamClose$;
    }

    /**
     * Live stream catch
     */
    private _liveStreamCatch$: Rx.Subject<string> = new Rx.Subject();
    public get liveStreamCatch$(): Rx.Subject<string> {
        return this._liveStreamCatch$;
    }

    /**
     * Live stream stop
     */
    private _liveStreamStop$: Rx.Subject<{}> = new Rx.Subject();
    public get liveStreamStop$(): Rx.Subject<{}> {
        return this._liveStreamStop$;
    }

    /**
     * Initialization
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
            if (!this._config.wsport || !Regex.IsPort(this._config.wsport.toString())) {
                throw Base.Message.SettingPortError;
            }
        }

        this._baseUrl = `${this._config.protocol}://${this._config.ip}:${this._config.port}`;
        this._baseWsUrl = `ws://${this._config.ip}:${this._config.wsport}`;
        this._isInitialization = true;
    }

    /**
     * Login
     */
    public async Login(): Promise<string> {
        try {
            let url: string = `${this._baseUrl}/users/login`;

            let result: FRS.ILoginResponse = await new Promise<FRS.ILoginResponse>((resolve, reject) => {
                try {
                    HttpClient.post(
                        {
                            url: url,
                            json: true,
                            body: {
                                username: this._config.account,
                                password: this._config.password,
                            },
                        },
                        (error, response, body) => {
                            if (error) {
                                return reject(error);
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

            this._sessionId = result.sessionId;

            return result.sessionId;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Get device list
     * @param sessionId
     */
    public async GetDeviceList(): Promise<FRS.IDevice[]>;
    public async GetDeviceList(sessionId: string): Promise<FRS.IDevice[]>;
    public async GetDeviceList(sessionId?: string): Promise<FRS.IDevice[]> {
        try {
            let url: string = `${this._baseUrl}/devices?sessionId=${encodeURIComponent(sessionId || this._sessionId)}`;

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

            let devices: FRS.IDevice[] = result.fcs_settings.map((value, index, array) => {
                return {
                    sourceid: value.video_source_sourceid,
                    location: value.video_source_location,
                    type: value.video_source_type,
                    ip: value.video_source_ip,
                    port: value.video_source_port,
                    username: value.video_source_username,
                    password: value.video_source_password,
                    channelId: value.video_source_channel,
                    nvrId: value.video_source_nvr_id,
                    rtspPath: value.video_source_rtsp_path,
                };
            });

            return devices;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Get snapshot
     * @param imageSrc
     * @param sessionId
     */
    public async GetSnapshot(imageSrc: string): Promise<Buffer>;
    public async GetSnapshot(imageSrc: string, sessionId: string): Promise<Buffer>;
    public async GetSnapshot(imageSrc: string, sessionId?: string): Promise<Buffer> {
        try {
            let url: string = `${this._baseUrl}/frs/cgi/snapshot/session_id=${encodeURIComponent(sessionId || this.sessionId)}&image=${encodeURIComponent(imageSrc)}`;

            let result: Buffer = await new Promise<Buffer>((resolve, reject) => {
                try {
                    HttpClient.get(
                        {
                            url: url,
                            encoding: null,
                            json: true,
                        },
                        (error, response, body) => {
                            if (error) {
                                return reject(error);
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

            return result;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Get user groups
     * @param sessionId
     */
    public async GetUserGroups(): Promise<FRS.IObject[]>;
    public async GetUserGroups(sessionId: string): Promise<FRS.IObject[]>;
    public async GetUserGroups(sessionId?: string): Promise<FRS.IObject[]> {
        try {
            let url: string = `${this._baseUrl}/persons/group?sessionId=${encodeURIComponent(sessionId || this.sessionId)}&page_size=1000&skip_pages=0`;

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

            let groups: FRS.IObject[] = result.group_list.groups.map((value, index, array) => {
                return {
                    objectId: value.group_id,
                    name: value.name,
                };
            });

            return groups;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Verify Face
     * @param buffer
     * @param scale
     * @param sessionId
     */
    public async VerifyFace(buffer: Buffer, scale: number): Promise<FRS.IVerifyFace>;
    public async VerifyFace(buffer: Buffer, scale: number, sessionId: string): Promise<FRS.IVerifyFace>;
    public async VerifyFace(buffer: Buffer, scale: number, sessionId?: string): Promise<FRS.IVerifyFace> {
        try {
            let url: string = `${this._baseUrl}/frs/cgi/verifyface`;

            let urls: string[] = [`${this._baseWsUrl}/fcsrecognizedresult`, `${this._baseWsUrl}/fcsnonrecognizedresult`];

            let sourceId: string = Utility.RandomText(20, { symbol: false });

            let wss: Ws[] = [];

            let result: FRS.IVerifyFace = await new Promise<FRS.IVerifyFace>(async (resolve, reject) => {
                try {
                    await Promise.all(
                        urls.map(async (value, index, array) => {
                            let ws = new Ws();
                            ws.url = value;

                            ws.message$.subscribe({
                                next: (data) => {
                                    try {
                                        if ('type' in data) {
                                            let result = data as FRSCore.RecognizedUser | FRSCore.UnRecognizedUser;

                                            let camera: string = result.channel;
                                            if (camera === sourceId) {
                                                if (result.type === FRSCore.UserType.Recognized) {
                                                    let name: string = result.person_info.fullname;
                                                    let groups: FRS.IObject[] = result.person_info['group_list'].map((value, index, array) => {
                                                        return {
                                                            objectId: value.id,
                                                            name: value.groupname,
                                                        };
                                                    });

                                                    resolve({
                                                        name: name,
                                                        groups: groups,
                                                    });
                                                } else {
                                                    resolve(undefined);
                                                }
                                            }
                                        }
                                    } catch (e) {
                                        return reject(e);
                                    }
                                },
                            });
                            ws.error$.subscribe({
                                next: (e) => {
                                    return reject(e);
                                },
                            });

                            await ws.Connect();

                            wss.push(ws);
                        }),
                    );

                    HttpClient.post(
                        {
                            url: url,
                            json: true,
                            body: {
                                target_score: scale,
                                request_client: 'test',
                                action_enable: 0,
                                source_id: sourceId,
                                location: 'web',
                                image: buffer.toString(Enum.EEncoding.base64),
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
                        },
                    );
                } catch (e) {
                    return reject(e);
                }
            }).catch(async (e) => {
                await Promise.all(
                    wss.map(async (value, index, array) => {
                        await value.Close();
                    }),
                );

                throw e;
            });

            await Promise.all(
                wss.map(async (value, index, array) => {
                    await value.Close();
                }),
            );

            return result;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Verify Blacklist
     * @param buffer
     * @param scale
     * @param sessionId
     */
    public async VerifyBlacklist(buffer: Buffer, scale: number): Promise<FRS.IVerifyFace>;
    public async VerifyBlacklist(buffer: Buffer, scale: number, sessionId: string): Promise<FRS.IVerifyFace>;
    public async VerifyBlacklist(buffer: Buffer, scale: number, sessionId?: string): Promise<FRS.IVerifyFace> {
        try {
            let face: FRS.IVerifyFace = await this.VerifyFace(buffer, scale, sessionId);
            if (!face) {
                return undefined;
            }

            let groups: string[] = face.groups.map((value, index, array) => {
                return value.name.toLocaleLowerCase();
            });
            if (groups.indexOf('blacklist') > -1) {
                return face;
            }

            return undefined;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Enable Live Subject
     * @param sessionId
     */
    public async EnableLiveSubject(): Promise<void>;
    public async EnableLiveSubject(sessionId: string): Promise<void>;
    public async EnableLiveSubject(sessionId?: string): Promise<void> {
        if (!this._isInitialization) {
            throw Base.Message.NotInitialization;
        }

        let urls: string[] = ['fcsrecognizedresult', 'fcsnonrecognizedresult'];
        await Promise.all(
            urls.map(async (value, index, array) => {
                let ws = new Ws();
                ws.url = `${this._baseWsUrl}/${value}`;

                this._liveStream$ = new Rx.Subject();
                this._liveStreamCatch$ = new Rx.Subject();
                this._liveStreamClose$ = new Rx.Subject();
                this._liveStreamStop$ = new Rx.Subject();

                this._liveStreamStop$.subscribe({
                    next: () => {
                        this._liveStream$.complete();
                        this._liveStreamCatch$.complete();
                        this._liveStreamClose$.complete();
                        this._liveStreamStop$.complete();

                        ws.message$.complete();
                        ws.open$.complete();
                        ws.error$.complete();
                        ws.close$.complete();
                        ws.Close();
                    },
                });

                this._liveStream$ = new Rx.Subject();

                ws.message$.subscribe({
                    next: async (data) => {
                        try {
                            if ('type' in data) {
                                let result = data as FRSCore.RecognizedUser | FRSCore.UnRecognizedUser;

                                let date: Date = new Date(result.timestamp);
                                let camera: string = result.channel;
                                let faceId: string = result.verify_face_id;
                                let name: string = 'unknown';
                                let snapshot: Buffer = await this.GetSnapshot(result.snapshot);
                                let groups: FRS.IObject[] = [];

                                if (result.type === FRSCore.UserType.Recognized) {
                                    name = result.person_info.fullname;
                                    groups = result.person_info['group_list'].map((value, index, array) => {
                                        return {
                                            objectId: value.id,
                                            name: value.groupname,
                                        };
                                    });
                                }

                                this._liveStream$.next({
                                    name: name,
                                    camera: camera,
                                    faceId: faceId,
                                    date: date,
                                    groups: groups,
                                    image: snapshot,
                                });
                            }
                        } catch (e) {
                            this._liveStreamCatch$.next(e);
                        }
                    },
                });
                ws.error$.subscribe({
                    next: (e) => {
                        this._liveStreamCatch$.next(e.message);
                    },
                });
                ws.close$.subscribe({
                    next: (e) => {
                        this._liveStreamClose$.next();
                    },
                });

                await ws.Connect();
            }),
        );
    }
}

export namespace FRS {
    /**
     *
     */
    export interface IConfig {
        protocol: 'http' | 'https';
        ip: string;
        port: number;
        wsport: number;
        account: string;
        password: string;
        specialScoreForUnRecognizedFace?: number;
        throttleKeepSameFaceSeconds?: number;
    }

    export interface IObject {
        objectId: string;
        name: string;
    }

    /**
     *
     */
    export interface IResult {
        name: string;
        camera: string;
        faceId: string;
        date: Date;
        groups: IObject[];
        image: Buffer;
    }

    /**
     *
     */
    export interface ILoginResponse {
        sessionId: string;
    }

    /**
     *
     */
    export interface IDevice {
        sourceid: string;
        location: string;
        type: string;
        ip: string;
        port: number;
        username: string;
        password: string;
        channelId: number;
        nvrId: number;
        rtspPath: string;
    }

    /**
     *
     */
    export interface IVerifyFace {
        name: string;
        groups: IObject[];
    }
}
