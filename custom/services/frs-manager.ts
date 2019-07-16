import { Config } from 'core/config.gen';
import * as Rx from 'rxjs';
import { IDB } from '../models';
import { Print, File, Utility, Ws } from '../helpers';
import * as Enum from '../enums';
import * as Action from '../actions';
import * as Main from '../../main';
import * as HttpClient from 'request';

class Service {
    /**
     *
     */
    private _initialization$: Rx.Subject<{}> = new Rx.Subject();

    /**
     *
     */
    private _config = {
        protocol: 'http',
        ip: '172.16.10.109',
        port: 6060,
        account: 'whc',
        password: 'whc',
    };

    /**
     *
     */
    private _frsConfigs: IDB.ServerFRS[] = [];

    /**
     *
     */
    private _devices: IDB.Device[] = [];

    /**
     *
     */
    private _sessionId: string = '';

    /**
     *
     */
    constructor() {
        let next$: Rx.Subject<{}> = new Rx.Subject();
        this._initialization$
            .debounceTime(1000)
            .zip(next$.startWith(0))
            .subscribe({
                next: async () => {
                    try {
                        await this.Initialization();
                    } catch (e) {
                        Print.Log(e, new Error(), 'error');
                    }

                    next$.next();
                },
            });

        IDB.ServerFRS.notice$.subscribe({
            next: (x) => {
                if (x.crud === 'u') {
                    this._initialization$.next();
                }
            },
        });

        IDB.Device.notice$.subscribe({
            next: (x) => {
                if ((x.crud === 'c' || x.crud === 'u' || x.crud === 'd') && x.data.get('model') === Enum.EDeviceModelIsap.frs) {
                    this._initialization$.next();
                }
            },
        });

        Main.ready$.subscribe({
            next: async () => {
                this._initialization$.next();
            },
        });
    }

    /**
     * Initialization
     */
    private async Initialization(): Promise<void> {
        try {
            this.Stop();

            await this.Search();

            await this.EnableLiveStream();
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            this._initialization$.next();
        }
    }

    /**
     * Stop
     */
    private Stop(): void {
        try {
        } catch (e) {
            throw e;
        }
    }

    /**
     * Search
     */
    private async Search(): Promise<void> {
        try {
            this._sessionId = await this.Login();

            this._devices = await new Parse.Query(IDB.Device)
                .equalTo('brand', Enum.EDeviceBrand.isap)
                .equalTo('model', Enum.EDeviceModelIsap.frs)
                .notEqualTo('site', null)
                .notEqualTo('area', null)
                .include(['site', 'area', 'groups', 'config.server'])
                .find()
                .fail((e) => {
                    throw e;
                });

            this._frsConfigs = this._devices.map((value, index, array) => {
                return (value.getValue('config') as IDB.ICameraFRS).server;
            });

            let frsConfigIds = this._frsConfigs.map((value, index, array) => {
                return value.id;
            });
            this._frsConfigs = this._frsConfigs.filter((value, index, array) => {
                return frsConfigIds.indexOf(value.id) === index;
            });
        } catch (e) {
            throw e;
        }
    }

    /**
     * Login
     */
    public async Login(): Promise<string> {
        try {
            let url: string = `${this._config.protocol}://${this._config.ip}:${this._config.port}/users/login`;

            let result: any = await new Promise<any>((resolve, reject) => {
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

            return result.sessionId;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Get snapshot
     * @param imageSrc
     */
    public async GetSnapshot(imageSrc: string): Promise<Buffer> {
        try {
            let url: string = imageSrc;

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
     * Get frs list
     */
    public async GetFrsList(): Promise<Service.IFRSList[]> {
        try {
            let url: string = `${this._config.protocol}://${this._config.ip}:${this._config.port}/frs?sessionId=${encodeURIComponent(this._sessionId)}`;

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

            let list = result.results.map((value, index, array) => {
                return {
                    objectId: value.objectId,
                    ip: value.ip,
                    port: value.port,
                    account: value.account,
                    password: value.password,
                };
            });

            return list;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Enable live stream
     */
    private async EnableLiveStream(): Promise<void> {
        try {
            let ws = new Ws();
            ws.url = `ws://${this._config.ip}:${this._config.port}/listen?sessionId=${encodeURIComponent(this._sessionId)}`;

            ws.error$.subscribe({
                next: (e) => {
                    Print.Log(e, new Error(), 'error');
                    ws.Close();
                },
            });
            ws.close$.subscribe({
                next: async (e) => {
                    try {
                        this._initialization$.next();
                    } catch (e) {
                        Print.Log(e, new Error(), 'error');
                    }
                },
            });
            ws.message$.subscribe({
                next: async (x) => {
                    try {
                        if ('objectId' in x) {
                            let result = x as Service.INxNFacesResult;

                            let frsConfig = this._frsConfigs.find((value1, index1, array1) => {
                                return result.currentUrl.indexOf(`${value1.getValue('ip')}:${value1.getValue('port')}`) > -1;
                            });
                            if (!frsConfig) {
                                return;
                            }

                            let image: Buffer = await this.GetSnapshot(result.currentUrl);

                            let temp: string = `${File.assetsPath}/temp/${Utility.RandomText(10, { symbol: false })}_${new Date().getTime()}.png`;
                            File.WriteFile(temp, image);
                            image = null;

                            let devices = this._devices.filter((value1, index1, array1) => {
                                let config = value1.getValue('config') as IDB.ICameraFRS;
                                return config.server.id === frsConfig.id;
                            });

                            let relation = result.relations.find((value1, index1, array1) => {
                                return value1.frsId === result.currentSource.frsId;
                            });
                            if (relation) {
                                let employee = relation.person_info.group_list.find((value1, index1, array1) => {
                                    return !!frsConfig.getValue('userGroups').find((value2, index2, array2) => {
                                        return value2.objectId === value1.id && value2.type === Enum.EPeopleType.employee;
                                    });
                                });
                                if (employee) {
                                    return;
                                }
                            }

                            devices.forEach((value1, index1, array1) => {
                                switch (value1.getValue('mode')) {
                                    case Enum.EDeviceMode.peopleCounting:
                                        break;
                                    case Enum.EDeviceMode.dwellTime:
                                        break;
                                    case Enum.EDeviceMode.demographic:
                                        Action.Demographic.action$.next({
                                            device: value1,
                                            date: new Date(result.timestamp),
                                            image: temp,
                                            faceId: result.objectId,
                                        });
                                        break;
                                    case Enum.EDeviceMode.visitor:
                                        break;
                                    default:
                                        throw `${value1.id}(device) mode not found`;
                                }
                            });
                        }
                    } catch (e) {
                        Print.Log(e, new Error(), 'error');
                    }
                },
            });

            await ws.Connect();
        } catch (e) {
            throw e;
        }
    }
}
export default new Service();

namespace Service {
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
        /// unique key of face
        objectId: string;
        /// relation to FRS of recognized user
        relations: IRecognizedRelatedUnit[];
        /// source of db matched face
        source: IFaceSource;
        /// for debug
        url: string;

        /// source of current face
        currentSource: IFaceSource;
        /// for debug
        currentUrl: string;

        /// currentSource compare to source
        score: number;
        /// happen time
        timestamp: Date;
    }
}
