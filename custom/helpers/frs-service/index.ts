import * as Rx from 'rxjs';
import * as HttpClient from 'request';
import {} from '../../models';
import { Regex, Print, Parser } from '../';
import { Base } from './base';
import { FRSService as FRS, FRSCore } from './frs-service';

export class FRSService {
    /**
     * Config
     */
    private _analysisConfig: FRSService.IAnalysisConfig = undefined;
    public get analysisConfig(): FRSService.IAnalysisConfig {
        return JSON.parse(JSON.stringify(this._analysisConfig));
    }
    public set analysisConfig(value: FRSService.IAnalysisConfig) {
        this._analysisConfig = value;
    }

    /**
     * Config
     */
    private _manageConfig: FRSService.IManageCinfig = undefined;
    public get manageConfig(): FRSService.IManageCinfig {
        return JSON.parse(JSON.stringify(this._manageConfig));
    }
    public set manageConfig(value: FRSService.IManageCinfig) {
        this._manageConfig = value;
    }

    /**
     * Base url
     */
    private _manageBaseUrl: string = '';
    public get manageBaseUrl(): string {
        return this._manageBaseUrl;
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
    private _liveStream$: Rx.Subject<FRSService.IResult> = new Rx.Subject();
    public get liveStream$(): Rx.Subject<FRSService.IResult> {
        return this._liveStream$;
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
        if (!this._analysisConfig) {
            throw Base.Message.ConfigNotSetting;
        } else {
            if (!this._analysisConfig.ip || !Regex.IsIp(this._analysisConfig.ip)) {
                throw Base.Message.SettingIpError;
            }
            if (!this._analysisConfig.port || !Regex.IsPort(this._analysisConfig.port.toString())) {
                throw Base.Message.SettingPortError;
            }
            if (!this._analysisConfig.wsport || !Regex.IsPort(this._analysisConfig.wsport.toString())) {
                throw Base.Message.SettingPortError;
            }
        }
        if (!this._manageConfig) {
            throw Base.Message.ConfigNotSetting;
        } else {
            if (!this._manageConfig.ip || !Regex.IsIp(this._manageConfig.ip)) {
                throw Base.Message.SettingIpError;
            }
            if (!this._manageConfig.port || !Regex.IsPort(this._manageConfig.port.toString())) {
                throw Base.Message.SettingPortError;
            }
        }

        this._manageBaseUrl = `${this._manageConfig.protocol}://${this._manageConfig.ip}:${this._manageConfig.port}`;
        this._isInitialization = true;
    }

    /**
     * Get device list
     */
    public async GetDeviceList(): Promise<FRSService.IDevice[]> {
        try {
            let sessionId: string = await this.Login();

            let url: string = `${this._manageBaseUrl}/devices?sessionId=${sessionId}`;

            let result: any = await new Promise<any>((resolve, reject) => {
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
                                return reject(
                                    `${response.statusCode}, ${Buffer.from(body)
                                        .toString()
                                        .replace(/\r\n/g, '; ')
                                        .replace(/\n/g, '; ')}`,
                                );
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

            let devices: FRSService.IDevice[] = result.fcs_settings.map((value, index, array) => {
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
     * Login
     */
    public async Login(): Promise<string> {
        try {
            let url: string = `${this._manageBaseUrl}/users/login`;

            let result: FRSService.ILoginResponse = await new Promise<FRSService.ILoginResponse>((resolve, reject) => {
                try {
                    HttpClient.post(
                        {
                            url: url,
                            encoding: null,
                            json: true,
                            body: {
                                username: this._manageConfig.account,
                                password: this._manageConfig.password,
                            },
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

            return result.sessionId;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Enable Live Subject
     */
    public async EnableLiveSubject(): Promise<void> {
        if (!this._isInitialization) {
            throw Base.Message.NotInitialization;
        }

        this._liveStreamStop$.subscribe({
            next: () => {
                this._liveStream$.complete();
                this._liveStreamStop$.complete();
                frs.stop();
            },
        });

        this._liveStream$ = new Rx.Subject();

        let frs: FRS = new FRS({
            frs: this._analysisConfig,
            debug: true,
        });

        frs.start();

        await frs.enableLiveFaces(true).catch((e) => {
            throw e;
        });

        frs.sjLiveStream.subscribe(async (face) => {
            let date: Date = new Date(face.timestamp);
            let camera: string = face.channel;
            let faceId: string = face.verify_face_id;
            let name: string = 'unknown';

            let image: string = await frs.snapshot(face).catch((e) => {
                throw e;
            });
            let buffer: Buffer = Buffer.from(image, Parser.Encoding.base64);

            if (face.type === FRSCore.UserType.Recognized) {
                name = face.person_info.fullname;
            }

            this._liveStream$.next({
                name: name,
                camera: camera,
                faceId: faceId,
                date: date,
                image: buffer,
            });
        });
    }
}

export namespace FRSService {
    /**
     *
     */
    export interface IAnalysisConfig {
        ip: string;
        port: number;
        wsport: number;
        account: string;
        password: string;
        specialScoreForUnRecognizedFace?: number;
        throttleKeepSameFaceSeconds?: number;
    }

    /**
     *
     */
    export interface IManageCinfig {
        protocol: 'http' | 'https';
        ip: string;
        port: number;
        account: string;
        password: string;
    }

    /**
     *
     */
    export interface IResult {
        name: string;
        camera: string;
        faceId: string;
        date: Date;
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
}
