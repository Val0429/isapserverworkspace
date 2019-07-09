import { Config } from 'core/config.gen';
import * as Rx from 'rxjs';
import { IDB } from '../models';
import { Print, File, Draw, Demographic } from '../helpers';
import * as Enum from '../enums';
import * as Main from '../../main';

class Action {
    /**
     *
     */
    private _initialization$: Rx.Subject<{}> = new Rx.Subject();

    /**
     *
     */
    private _config = Config.deviceDemographic;

    /**
     *
     */
    private _demos: Action.IDemo[] = [];
    public get demos(): Action.IDemo[] {
        return this._demos;
    }

    /**
     *
     */
    private _ageRanges: Action.IAgeRange[] = [];
    public get ageRanges(): Action.IAgeRange[] {
        return this._ageRanges;
    }

    /**
     *
     */
    private _action$: Rx.Subject<Action.IAction_Demographic | Action.IAction_RepeatVisitor> = new Rx.Subject();
    public get action$(): Rx.Subject<Action.IAction_Demographic | Action.IAction_RepeatVisitor> {
        return this._action$;
    }

    /**
     *
     */
    private _save$: Rx.Subject<Action.ISave> = new Rx.Subject();

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

        IDB.ServerDemographic.notice$.subscribe({
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
            await this.Search();

            this.GetAgeRange();
            this.EnableSaveStream();
            this.EnableLiveStream();
        } catch (e) {
            Print.Log(e, new Error(), 'error');
        }
    }

    /**
     * Get age range
     */
    private GetAgeRange() {
        try {
            let ageRange: string = this._config.ageRange;
            this._ageRanges = ageRange
                .split('-')
                .map(Number)
                .reduce<Action.IAgeRange[]>((prev, curr, index, array) => {
                    if (index !== 0) {
                        curr += prev[index - 1].min;
                        prev[index - 1].max = curr;
                    }

                    return prev.concat({
                        min: curr,
                        max: undefined,
                    });
                }, []);
        } catch (e) {
            throw e;
        }
    }

    /**
     * Search
     */
    private async Search(): Promise<void> {
        try {
            let servers: IDB.ServerDemographic[] = await new Parse.Query(IDB.ServerDemographic).find().fail((e) => {
                throw e;
            });

            this._demos = servers.map((value, index, array) => {
                Print.Log(`${value.id}(server)->${value.getValue('name')}`, new Error(), 'info');

                let demo: Demographic.ISap = new Demographic.ISap();
                demo.config = {
                    protocol: value.getValue('protocol'),
                    ip: value.getValue('ip'),
                    port: value.getValue('port'),
                };
                demo.margin = value.getValue('margin');

                demo.Initialization();

                return {
                    objectId: value.id,
                    name: value.getValue('name'),
                    demo: demo,
                };
            });
        } catch (e) {
            throw e;
        }
    }

    /**
     * Save report summary
     * @param report
     * @param type
     */
    private async SaveReportSummary(report: IDB.ReportDemographic, type: Enum.ESummaryType): Promise<void> {
        try {
            let date: Date = new Date(report.getValue('date'));
            switch (type) {
                case Enum.ESummaryType.hour:
                    date = new Date(date.setMinutes(0, 0, 0));
                    break;
                case Enum.ESummaryType.day:
                    date = new Date(date.setHours(0, 0, 0, 0));
                    break;
                case Enum.ESummaryType.month:
                    date = new Date(new Date(date.setDate(1)).setHours(0, 0, 0, 0));
                    break;
                case Enum.ESummaryType.season:
                    let season = Math.ceil((date.getMonth() + 1) / 3);
                    date = new Date(new Date(new Date(date.setMonth((season - 1) * 3)).setDate(1)).setHours(0, 0, 0, 0));
                    break;
            }

            let reportSummary: IDB.ReportDemographicSummary = await new Parse.Query(IDB.ReportDemographicSummary)
                .equalTo('device', report.getValue('device'))
                .equalTo('type', type)
                .equalTo('date', date)
                .first()
                .fail((e) => {
                    throw e;
                });

            let isEmployee = (report.getValue('userGroups') || []).indexOf(Enum.EPeopleType.employee) > -1;

            let ageIndex: number = this._ageRanges.findIndex((value, index, array) => {
                return value.min <= report.getValue('age') && (!value.max || value.max > report.getValue('age'));
            });

            if (reportSummary) {
                reportSummary.setValue('total', reportSummary.getValue('total') + 1);
                if (report.getValue('gender') === Enum.EGender.male) {
                    let ageRange = reportSummary.getValue('maleRanges');
                    ageRange[ageIndex] += 1;

                    reportSummary.setValue('maleTotal', reportSummary.getValue('maleTotal') + 1);
                    reportSummary.setValue('maleRanges', ageRange);

                    if (isEmployee) {
                        let ageRange = reportSummary.getValue('maleEmployeeRanges') || new Array(this._ageRanges.length).fill(0);
                        ageRange[ageIndex] += 1;

                        reportSummary.setValue('maleEmployeeTotal', reportSummary.getValue('maleEmployeeTotal') + 1);
                        reportSummary.setValue('maleEmployeeRanges', ageRange);
                    }
                } else {
                    let ageRange = reportSummary.getValue('femaleRanges');
                    ageRange[ageIndex] += 1;

                    reportSummary.setValue('femaleTotal', reportSummary.getValue('femaleTotal') + 1);
                    reportSummary.setValue('femaleRanges', ageRange);

                    if (isEmployee) {
                        let ageRange = reportSummary.getValue('femaleEmployeeRanges') || new Array(this._ageRanges.length).fill(0);
                        ageRange[ageIndex] += 1;

                        reportSummary.setValue('femaleEmployeeTotal', reportSummary.getValue('femaleEmployeeTotal') + 1);
                        reportSummary.setValue('femaleEmployeeRanges', ageRange);
                    }
                }
            } else {
                reportSummary = new IDB.ReportDemographicSummary();

                let ageRange: number[] = new Array(this._ageRanges.length).fill(0);
                ageRange[ageIndex] += 1;

                reportSummary.setValue('site', report.getValue('site'));
                reportSummary.setValue('area', report.getValue('area'));
                reportSummary.setValue('device', report.getValue('device'));
                reportSummary.setValue('type', type);
                reportSummary.setValue('date', date);
                reportSummary.setValue('total', 1);
                reportSummary.setValue('maleTotal', 0);
                reportSummary.setValue('maleEmployeeTotal', 0);
                reportSummary.setValue('maleRanges', new Array(this._ageRanges.length).fill(0));
                reportSummary.setValue('maleEmployeeRanges', new Array(this._ageRanges.length).fill(0));
                reportSummary.setValue('femaleTotal', 0);
                reportSummary.setValue('femaleEmployeeTotal', 0);
                reportSummary.setValue('femaleRanges', new Array(this._ageRanges.length).fill(0));
                reportSummary.setValue('femaleEmployeeRanges', new Array(this._ageRanges.length).fill(0));

                if (report.getValue('gender') === Enum.EGender.male) {
                    reportSummary.setValue('maleTotal', 1);
                    reportSummary.setValue('maleRanges', ageRange);

                    if (isEmployee) {
                        reportSummary.setValue('maleEmployeeTotal', 1);
                        reportSummary.setValue('maleEmployeeRanges', ageRange);
                    }
                } else {
                    reportSummary.setValue('femaleTotal', 1);
                    reportSummary.setValue('femaleRanges', ageRange);

                    if (isEmployee) {
                        reportSummary.setValue('femaleEmployeeTotal', 1);
                        reportSummary.setValue('femaleEmployeeRanges', ageRange);
                    }
                }
            }

            await reportSummary.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });
        } catch (e) {
            throw e;
        }
    }

    /**
     * Enable save stream
     */
    private EnableSaveStream(): void {
        try {
            let next$: Rx.Subject<{}> = new Rx.Subject();

            this._save$
                .zip(next$.startWith(0))
                .map((x) => {
                    return x[0];
                })
                .subscribe({
                    next: async (x) => {
                        try {
                            let tasks: Promise<any>[] = [];

                            tasks.push(x.report.save(null, { useMasterKey: true }) as any);
                            tasks.push(this.SaveReportSummary(x.report, Enum.ESummaryType.hour));
                            // tasks.push(this.SaveReportSummary(x.report, Enum.ESummaryType.day));
                            // tasks.push(this.SaveReportSummary(x.report, Enum.ESummaryType.month));
                            // tasks.push(this.SaveReportSummary(x.report, Enum.ESummaryType.season));

                            await Promise.all(tasks).catch((e) => {
                                throw e;
                            });
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
                                    try {
                                        let site: IDB.LocationSite = value.device.getValue('site');
                                        let area: IDB.LocationArea = value.device.getValue('area');
                                        let groups: IDB.DeviceGroup[] = value.device.getValue('groups');
                                        let device: IDB.Device = value.device;

                                        let demoConfig = this._config;
                                        let demo: Action.IDemo = this._demos.find((value1, index1, array1) => {
                                            return value1.objectId === device.getValue('demoServer').id;
                                        });
                                        if (!demo) {
                                            throw `${device.id}(device) -> demographic server not found`;
                                        }

                                        let image = demoConfig.output.image;
                                        let size: Draw.ISize = {
                                            width: image.width,
                                            height: image.height,
                                        };

                                        let feature = await demo.demo.GetAnalysis(value.image);
                                        if (!feature) {
                                            return;
                                        }

                                        value.image = await Draw.Resize(value.image, size, image.isFill, image.isTransparent);

                                        if ('faceId' in value) {
                                            let report: IDB.ReportRepeatVisitor = new IDB.ReportRepeatVisitor();

                                            report.setValue('site', site);
                                            report.setValue('area', area);
                                            report.setValue('device', device);
                                            report.setValue('date', value.date);
                                            report.setValue('imageSrc', '');
                                            report.setValue('age', feature.age);
                                            report.setValue('gender', feature.gender === Enum.EGender[Enum.EGender.male] ? Enum.EGender.male : Enum.EGender.female);
                                            report.setValue('faceId', value.faceId);

                                            await report.save(null, { useMasterKey: true }).fail((e) => {
                                                throw e;
                                            });

                                            let imageSrc: string = `images_report/repeat_visitor/${report.id}_report_${report.createdAt.getTime()}.${image.isTransparent ? 'png' : 'jpeg'}`;
                                            File.WriteFile(`${File.assetsPath}/${imageSrc}`, value.image);

                                            report.setValue('imageSrc', imageSrc);

                                            await report.save(null, { useMasterKey: true }).fail((e) => {
                                                throw e;
                                            });
                                        } else {
                                            let report: IDB.ReportDemographic = new IDB.ReportDemographic();

                                            report.setValue('site', site);
                                            report.setValue('area', area);
                                            report.setValue('device', device);
                                            report.setValue('date', value.date);
                                            report.setValue('imageSrc', '');
                                            report.setValue('age', feature.age);
                                            report.setValue('gender', feature.gender === Enum.EGender[Enum.EGender.male] ? Enum.EGender.male : Enum.EGender.female);
                                            report.setValue('userGroups', value.groups);

                                            await report.save(null, { useMasterKey: true }).fail((e) => {
                                                throw e;
                                            });

                                            let imageSrc: string = `images_report/demographic/${report.id}_report_${report.createdAt.getTime()}.${image.isTransparent ? 'png' : 'jpeg'}`;
                                            File.WriteFile(`${File.assetsPath}/${imageSrc}`, value.image);

                                            report.setValue('imageSrc', imageSrc);

                                            this._save$.next({ report: report });
                                        }
                                    } catch (e) {
                                        Print.Log(e, new Error(), 'error');
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
    export interface IDemo {
        objectId: string;
        name: string;
        demo: Demographic.ISap;
    }

    /**
     *
     */
    export interface IAction_Base {
        device: IDB.Device;
        date: Date;
        image: Buffer;
    }

    /**
     *
     */
    export interface IAction_Demographic extends IAction_Base {
        groups: Enum.EPeopleType[];
    }

    export interface IAction_RepeatVisitor extends IAction_Base {
        faceId: string;
    }

    /**
     *
     */
    export interface IAgeRange {
        min: number;
        max: number;
    }

    /**
     *
     */
    export interface ISave {
        report: IDB.ReportDemographic;
    }
}
