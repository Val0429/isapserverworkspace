import { Config } from 'core/config.gen';
import * as Rx from 'rxjs';
import { IDB } from '../models';
import { Print, Draw, DateTime, File, Demographic, Utility } from '../helpers';
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
    private _dtConfig = Config.deviceDwellTime;

    /**
     *
     */
    private _imageConfig = this._config.output.image;

    /**
     *
     */
    private _imageSize: Draw.ISize = {
        width: this._imageConfig.width,
        height: this._imageConfig.height,
    };

    /**
     *
     */
    private _timeRanges: Utility.IValueRange[] = undefined;
    public get timeRanges(): Utility.IValueRange[] {
        return this._timeRanges;
    }

    /**
     *
     */
    private _ageRanges: Utility.IValueRange[] = undefined;
    public get ageRanges(): Utility.IValueRange[] {
        return this._ageRanges;
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
            this._ageRanges = Utility.Str2ValueRange(this._config.ageRange);
            this._timeRanges = Utility.Str2ValueRange(this._dtConfig.timeRange);

            this.EnableLiveStream();
        } catch (e) {
            Print.Log(e, new Error(), 'error');
        }
    }

    /**
     * Generate Age Range
     * @param report
     * @param reportSummary
     * @param prevReport
     */
    private GenerateAgeRanges(report: IDB.ReportDemographic, reportSummary: IDB.ReportDemographicSummary, prevReport: Partial<IDB.IReportDemographic>): IDB.IReportAgeRange[] {
        try {
            let ageRanges: IDB.IReportAgeRange[] =
                reportSummary.getValue('ageRanges') ||
                Array.from({ length: this._ageRanges.length }, () => {
                    return {
                        total: 0,
                        male: 0,
                        maleEmployee: 0,
                        female: 0,
                        femaleEmployee: 0,
                        dwellTimeRanges: Array.from({ length: this._timeRanges.length }, () => 0),
                        dwellTimeEmployeeRanges: Array.from({ length: this._timeRanges.length }, () => 0),
                    };
                });

            let ageIndex: number = Utility.GetValueRangeLevel(report.getValue('age'), this._ageRanges);
            let currLevel: number = report.getValue('dwellTimeLevel');
            let isEmployee = report.getValue('isEmployee');

            ageRanges[ageIndex].dwellTimeRanges[currLevel] += 1;
            if (isEmployee) {
                ageRanges[ageIndex].dwellTimeEmployeeRanges[currLevel] += 1;
            }

            if (!prevReport) {
                ageRanges[ageIndex].total += 1;

                if (report.getValue('gender') === Enum.EGender.male) {
                    ageRanges[ageIndex].male += 1;
                } else {
                    ageRanges[ageIndex].female += 1;
                }

                if (isEmployee) {
                    if (report.getValue('gender') === Enum.EGender.male) {
                        ageRanges[ageIndex].maleEmployee += 1;
                    } else {
                        ageRanges[ageIndex].femaleEmployee += 1;
                    }
                }
            } else {
                ageRanges[ageIndex].dwellTimeRanges[prevReport.dwellTimeLevel] -= 1;

                if (isEmployee) {
                    ageRanges[ageIndex].dwellTimeEmployeeRanges[prevReport.dwellTimeLevel] -= 1;
                }
            }

            return ageRanges;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Save report summary
     * @param report
     * @param prevReport
     * @param type
     */
    private async SaveReportSummary(report: IDB.ReportDemographic, prevReport: Partial<IDB.IReportDemographic>, type: Enum.ESummaryType): Promise<void> {
        try {
            let date: Date = DateTime.Type2Date(report.getValue('date'), type);

            let reportSummary: IDB.ReportDemographicSummary = await new Parse.Query(IDB.ReportDemographicSummary)
                .equalTo('device', report.getValue('device'))
                .equalTo('type', type)
                .equalTo('date', date)
                .first()
                .fail((e) => {
                    throw e;
                });

            if (reportSummary) {
                reportSummary.setValue('ageRanges', this.GenerateAgeRanges(report, reportSummary, prevReport));
            } else {
                reportSummary = new IDB.ReportDemographicSummary();

                reportSummary.setValue('site', report.getValue('site'));
                reportSummary.setValue('area', report.getValue('area'));
                reportSummary.setValue('device', report.getValue('device'));
                reportSummary.setValue('type', type);
                reportSummary.setValue('date', date);
                reportSummary.setValue('ageRanges', this.GenerateAgeRanges(report, reportSummary, prevReport));
            }

            await reportSummary.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });
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
                .zip(next$.startWith(0))
                .map((x) => {
                    return x[0];
                })
                .subscribe({
                    next: async (x) => {
                        let buffer: Buffer = x.buffer;

                        try {
                            buffer = await Draw.Resize(buffer, this._imageSize, this._imageConfig.isFill, this._imageConfig.isTransparent);

                            let isEmployee = (x.groups || []).indexOf(Enum.EPeopleType.employee) > -1;
                            let isIn = x.base.device.getValue('direction') === Enum.EDeviceDirection.in;

                            let report: IDB.ReportDemographic = await new Parse.Query(IDB.ReportDemographic)
                                .equalTo('faceId', x.faceId)
                                .descending('date')
                                .first()
                                .fail((e) => {
                                    throw e;
                                });

                            if (isIn && (!report || !!report.getValue('outDate'))) {
                                report = new IDB.ReportDemographic();

                                report.setValue('site', x.base.site);
                                report.setValue('area', x.base.area);
                                report.setValue('device', x.base.device);
                                report.setValue('date', x.base.date);
                                report.setValue('imageSrc', '');
                                report.setValue('age', x.feature.age);
                                report.setValue('gender', x.feature.gender === Enum.EGender[Enum.EGender.male] ? Enum.EGender.male : Enum.EGender.female);
                                report.setValue('isEmployee', isEmployee);
                                report.setValue('userGroups', x.groups);
                                report.setValue('faceId', x.faceId);
                                report.setValue('inDate', x.base.date);

                                await report.save(null, { useMasterKey: true }).fail((e) => {
                                    throw e;
                                });

                                let imageSrc: string = `images_report/demographic/${DateTime.ToString(report.createdAt, 'YYYYMMDD')}/${report.id}_report_${report.createdAt.getTime()}.${this._imageConfig.isTransparent ? 'png' : 'jpeg'}`;
                                File.WriteFile(`${File.assetsPath}/${imageSrc}`, buffer);

                                report.setValue('imageSrc', imageSrc);

                                await report.save(null, { useMasterKey: true }).fail((e) => {
                                    throw e;
                                });
                            }

                            if (!!report && !isIn) {
                                let prevReport: Partial<IDB.IReportDemographic> = undefined;
                                if (!!report.getValue('outDate')) {
                                    prevReport = {};
                                    prevReport.dwellTimeLevel = report.getValue('dwellTimeLevel');
                                    prevReport.dwellTimeSecond = report.getValue('dwellTimeSecond');
                                }

                                report.setValue('outDate', x.base.date);

                                let second: number = Utility.Round((report.getValue('outDate').getTime() - report.getValue('inDate').getTime()) / 1000, 0);
                                let level: number = Utility.GetValueRangeLevel(second, this._timeRanges, 60);

                                report.setValue('dwellTimeSecond', second);
                                report.setValue('dwellTimeLevel', level);

                                await report.save(null, { useMasterKey: true }).fail((e) => {
                                    throw e;
                                });

                                let tasks: Promise<any>[] = [];

                                tasks.push(this.SaveReportSummary(report, prevReport, Enum.ESummaryType.hour));
                                // tasks.push(this.SaveReportSummary(report, prevReport, Enum.ESummaryType.day));
                                // tasks.push(this.SaveReportSummary(report, prevReport, Enum.ESummaryType.month));
                                // tasks.push(this.SaveReportSummary(report, prevReport, Enum.ESummaryType.season));

                                await Promise.all(tasks).catch((e) => {
                                    throw e;
                                });
                            }
                        } catch (e) {
                            Print.Log(e, new Error(), 'error');
                        } finally {
                            buffer = null;
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
    export interface IAction {
        base: IDB.IReportBase;
        buffer: Buffer;
        feature: Demographic.ISap.IFeature;
        faceId: string;
        groups: Enum.EPeopleType[];
    }
}
