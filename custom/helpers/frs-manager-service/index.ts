import * as Rx from 'rxjs';
import * as HttpClient from 'request';
import {} from '../../models';
import { Regex, Ws } from '../';
import { Base } from './base';

export class FRSManagerService {
    /**
     * Config
     */
    private _config: FRSManagerService.IConfig = undefined;
    public get config(): FRSManagerService.IConfig {
        return JSON.parse(JSON.stringify(this._config));
    }
    public set config(value: FRSManagerService.IConfig) {
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
    private _liveStream$: Rx.Subject<FRSManagerService.ILiveStream> = new Rx.Subject();
    public get liveStream$(): Rx.Subject<FRSManagerService.ILiveStream> {
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
        }

        this._baseUrl = `${this._config.protocol}://${this._config.ip}:${this._config.port}`;
        this._baseWsUrl = `ws://${this._config.ip}:${this._config.port}`;

        this._isInitialization = true;
    }

    /**
     * Login
     */
    public async Login(): Promise<string> {
        try {
            let url: string = `${this._baseUrl}/users/login`;

            let result: FRSManagerService.ILoginResponse = await new Promise<FRSManagerService.ILoginResponse>((resolve, reject) => {
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
     * Get device tree
     * @param sessionId
     */
    public async GetDeviceTree(): Promise<FRSManagerService.IFRSDeviceTree[]>;
    public async GetDeviceTree(sessionId: string): Promise<FRSManagerService.IFRSDeviceTree[]>;
    public async GetDeviceTree(sessionId?: string): Promise<FRSManagerService.IFRSDeviceTree[]> {
        try {
            let url: string = `${this._baseUrl}/frs?sessionId=${encodeURIComponent(sessionId || this.sessionId)}&page_size=1000&skip_pages=0`;

            let result: any = await new Promise<any>((resolve, reject) => {
                try {
                    HttpClient.get(
                        {
                            url: url,
                            json: true,
                            auth: {
                                user: this._config.account,
                                pass: this._config.password,
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

            let nvrs = ((result.results as any[]) || [])
                .map<FRSManagerService.IFRSDeviceTree>((value, index, array) => {
                    return {
                        frsId: value.objectId,
                        frsIp: value.ip,
                        channels: (value.devices as any[]).map<FRSManagerService.IFRSDeviceChannel>((value1, index1, array1) => {
                            return {
                                ip: value1.video_source_ip,
                                sourceId: value1.video_source_sourceid,
                            };
                        }),
                    };
                })
                .filter((value, index, array) => {
                    return !!value;
                });

            return nvrs;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Get device list
     * @param sessionId
     */
    public async GetDeviceList(): Promise<FRSManagerService.IFRSDevice[]>;
    public async GetDeviceList(sessionId: string): Promise<FRSManagerService.IFRSDevice[]>;
    public async GetDeviceList(sessionId?: string): Promise<FRSManagerService.IFRSDevice[]> {
        try {
            let frss = await this.GetDeviceTree(sessionId);

            let list = [].concat(
                ...frss.map<FRSManagerService.IFRSDevice[]>((value, index, array) => {
                    return value.channels.map((value1, index1, array1) => {
                        return {
                            frsId: value.frsId,
                            frsIp: value.frsIp,
                            ip: value1.ip,
                            sourceId: value1.sourceId,
                        };
                    });
                }),
            );

            return list;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Get snapshot
     * @param url
     * @param sessionId
     */
    public async GetSnapshot(url: string): Promise<Buffer>;
    public async GetSnapshot(url: string, sessionId: string): Promise<Buffer>;
    public async GetSnapshot(url: string, sessionId?: string): Promise<Buffer> {
        try {
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
    public async GetUserGroups(): Promise<FRSManagerService.IObject[]>;
    public async GetUserGroups(sessionId: string): Promise<FRSManagerService.IObject[]>;
    public async GetUserGroups(sessionId?: string): Promise<FRSManagerService.IObject[]> {
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

            let groups: FRSManagerService.IObject[] = result.group_list.groups.map((value, index, array) => {
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
     * Enable Live Subject
     * @param sessionId
     */
    public async EnableLiveSubject(): Promise<void>;
    public async EnableLiveSubject(sessionId: string): Promise<void>;
    public async EnableLiveSubject(sessionId?: string): Promise<void> {
        if (!this._isInitialization) {
            throw Base.Message.NotInitialization;
        }

        let ws = new Ws();
        ws.url = `${this._baseWsUrl}/listen?sessionId=${encodeURIComponent(sessionId || this._sessionId)}`;

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
                    if ('objectId' in data) {
                        let result = data as NxN.INxNFacesResult;

                        let objectId: string = result.objectId;
                        let date: Date = new Date(result.timestamp);
                        let frsId: string = result.currentSource.frsId;
                        let camera: string = result.currentSource.channel;
                        let snapshot: Buffer = await this.GetSnapshot(result.currentUrl);
                        let relation = result.relations.find((value, index, array) => {
                            return value.frsId === frsId;
                        });
                        let groups = [];
                        if (relation) {
                            groups = (relation.person_info.group_list || []).map<FRSManagerService.IObject>((value, index, array) => {
                                return {
                                    objectId: value.id,
                                    name: value.groupname,
                                };
                            });
                        }

                        this._liveStream$.next({
                            objectId: objectId,
                            frsId: frsId,
                            camera: camera,
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
    }
}

export namespace FRSManagerService {
    /**
     *
     */
    export interface IConfig {
        protocol: 'http' | 'https';
        ip: string;
        port: number;
        account: string;
        password: string;
    }

    /**
     *
     */
    export interface IObject {
        objectId: string;
        name: string;
    }

    /**
     *
     */
    export interface ILiveStream {
        objectId: string;
        frsId: string;
        camera: string;
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
    export interface IFRSDeviceTree {
        frsId: number;
        frsIp: string;
        channels: IFRSDeviceChannel[];
    }

    /**
     *
     */
    export interface IFRSDeviceChannel {
        ip: string;
        sourceId: string;
    }

    /**
     *
     */
    export interface IFRSDevice {
        frsId: number;
        frsIp: string;
        ip: string;
        sourceId: string;
    }
}

namespace NxN {
    /**
     *
     */
    export interface IFRSList {
        objectId: string;
        ip: string;
        port: number;
        account: string;
        password: string;
    }

    /**
     *
     */
    export interface IRecognizedRelatedUnit {
        frsId: string;
        person_id: string;
        person_info: {
            fullname: string;
            employeeno: string;
            group_list: {
                id: string;
                groupname: string;
            }[];
        };
    }

    /**
     *
     */
    export interface IFaceSource {
        frsId: string;
        snapshot: string;
        channel: string;
        faceFeature: Buffer;
    }

    /**
     * faces send to WS
     */
    export interface INxNFacesResult {
        objectId: string;
        relations: IRecognizedRelatedUnit[];
        source: IFaceSource;
        url: string;
        currentSource: IFaceSource;
        currentUrl: string;
        score: number;
        timestamp: Date;
    }
}
