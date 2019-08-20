import { Config } from 'core/config.gen';
import * as Rx from 'rxjs';
import { IDB } from '../models';
import { Print, Draw, File, HumanDetection } from '../helpers';
import * as Enum from '../enums';
import * as Main from '../../main';
import { DeleteFile, SaveHumanDetection, SaveHeatmap } from './';

class Action {
    /**
     *
     */
    private _initialization$: Rx.Subject<{}> = new Rx.Subject();

    /**
     *
     */
    private _config = Config.deviceHumanDetection;

    /**
     *
     */
    private _hds: Action.IHD[] = [];
    public get hds(): Action.IHD[] {
        return this._hds;
    }

    /**
     *
     */
    private _action$: Rx.Subject<Action.IAction> = new Rx.Subject();
    public get action$(): Rx.Subject<Action.IAction> {
        return this._action$;
    }

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

        IDB.ServerHumanDetection.notice$.subscribe({
            next: (x) => {
                if (x.crud === 'c' || x.crud === 'u' || x.crud === 'd') {
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

            this.EnableLiveStream();
        } catch (e) {
            Print.Log(e, new Error(), 'error');
        }
    }

    /**
     * Stop
     */
    private Stop(): void {
        try {
            this._action$.complete();
            this._action$ = new Rx.Subject();
        } catch (e) {
            throw e;
        }
    }

    /**
     * Search
     */
    private async Search(): Promise<void> {
        try {
            let servers: IDB.ServerHumanDetection[] = await new Parse.Query(IDB.ServerHumanDetection).find().fail((e) => {
                throw e;
            });

            this._hds = servers.map((value, index, array) => {
                Print.Log(`${value.id}(server)->${value.getValue('name')}`, new Error(), 'info');

                let hd: HumanDetection.ISap = new HumanDetection.ISap();
                hd.config = {
                    protocol: value.getValue('protocol'),
                    ip: value.getValue('ip'),
                    port: value.getValue('port'),
                };
                hd.score = value.getValue('target_score');

                hd.Initialization();

                return {
                    objectId: value.id,
                    name: value.getValue('name'),
                    hd: hd,
                };
            });
        } catch (e) {
            throw e;
        }
    }

    /**
     * Location filter
     * @param rois
     * @param locations
     */
    private LocationFilter(rois: Draw.ILocation[], locations: HumanDetection.ILocation[]): HumanDetection.ILocation[] {
        try {
            if (!rois || rois.length === 0) {
                return locations;
            }

            locations = locations.filter((value, index, array) => {
                let centerX: number = value.x + value.width / 2;
                let centerY: number = value.y + value.height / 2;

                let roi = rois.find((value1, index1, array1) => {
                    return centerX >= value1.x && centerX <= value1.x + value1.width && centerY >= value1.y && centerY <= value1.y + value1.height;
                });

                return roi;
            });

            return locations;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Enable live stream
     */
    private EnableLiveStream(): void {
        try {
            let next$: Rx.Subject<{}> = new Rx.Subject();

            this._action$
                .buffer(this._action$.bufferCount(this._config.bufferCount).merge(Rx.Observable.interval(1000)))
                .zip(next$.startWith(0))
                .map((x) => {
                    return x[0];
                })
                .subscribe({
                    next: async (x) => {
                        try {
                            await Promise.all(
                                x.map(async (value, index, array) => {
                                    let buffer: Buffer = null;

                                    try {
                                        let site: IDB.LocationSite = value.device.getValue('site');
                                        let area: IDB.LocationArea = value.device.getValue('area');
                                        let groups: IDB.DeviceGroup[] = value.device.getValue('groups');
                                        let device: IDB.Device = value.device;

                                        let rois: Draw.ILocation[] = device.getValue('rois');

                                        let hdServer: Action.IHD = this._hds.find((value1, index1, array1) => {
                                            return value1.objectId === device.getValue('hdServer').id;
                                        });
                                        if (!hdServer) {
                                            throw `${device.id}(device) -> human detection server not found`;
                                        }

                                        buffer = File.ReadFile(value.imagePath);
                                        DeleteFile.action$.next(value.imagePath);

                                        let locations = await hdServer.hd.GetAnalysis(buffer);

                                        locations = this.LocationFilter(rois, locations);

                                        let base: IDB.IReportBase = {
                                            site: site,
                                            area: area,
                                            device: device,
                                            date: value.date,
                                        };

                                        if (value.type === 'humanDetection') {
                                            SaveHumanDetection.action$.next({
                                                base: base,
                                                buffer: buffer,
                                                locations: locations,
                                            });
                                        } else if (value.type === 'heatmap') {
                                            SaveHeatmap.action$.next({
                                                base: base,
                                                buffer: buffer,
                                                locations: locations,
                                            });
                                        }
                                    } catch (e) {
                                        Print.Log(e, new Error(), 'error');
                                    } finally {
                                        buffer = null;
                                    }
                                }),
                            );
                        } catch (e) {
                            Print.Log(e, new Error(), 'error');
                        }

                        next$.next();
                    },
                });
        } catch (e) {
            Print.Log(e, new Error(), 'error');
        }
    }
}
export default new Action();

namespace Action {
    /**
     *
     */
    export interface IHD {
        objectId: string;
        name: string;
        hd: HumanDetection.ISap;
    }

    /**
     *
     */
    export type IAction = IAction_HumanDetection | IAction_Heatmap;

    /**
     *
     */
    export interface IAction_Base {
        device: IDB.Device;
        date: Date;
        imagePath: string;
    }

    /**
     *
     */
    export interface IAction_HumanDetection extends IAction_Base {
        type: 'humanDetection';
    }

    /**
     *
     */
    export interface IAction_Heatmap extends IAction_Base {
        type: 'heatmap';
    }
}
