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
    private _config = Config.deviceDwellTime;

    /**
     *
     */
    private _demoConfig = Config.deviceDemographic;

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
            this._timeRanges = Utility.Str2ValueRange(this._config.timeRange);
            this._ageRanges = Utility.Str2ValueRange(this._demoConfig.ageRange);

            this.EnableLiveStream();
        } catch (e) {
            Print.Log(e, new Error(), 'error');
        }
    }

    /**
     * Generate Dwell Time Range
     * @param report
     * @param reportSummary
     * @param prevReport
     */
    private GenerateDwellTimeRanges(report: IDB.ReportDwellTime, reportSummary: IDB.ReportDwellTimeSummary, prevReport: Partial<IDB.IReportDwellTime>): IDB.IReportDemographicSummaryData[] {
        try {
            let dwellTimeRanges: IDB.IReportDemographicSummaryData[] =
                reportSummary.getValue('dwellTimeRanges') ||
                Array.from({ length: this._timeRanges.length }, () => {
                    return {
                        total: 0,
                        maleTotal: 0,
                        maleEmployeeTotal: 0,
                        maleRanges: new Array(this._ageRanges.length).fill(0),
                        maleEmployeeRanges: new Array(this._ageRanges.length).fill(0),
                        femaleTotal: 0,
                        femaleEmployeeTotal: 0,
                        femaleRanges: new Array(this._ageRanges.length).fill(0),
                        femaleEmployeeRanges: new Array(this._ageRanges.length).fill(0),
                    };
                });

            let ageIndex: number = Utility.GetValueRangeLevel(report.getValue('age'), this._ageRanges);
            let currLevel: number = report.getValue('dwellTimeLevel');
            let isEmployee = report.getValue('isEmployee');

            dwellTimeRanges[currLevel].total += 1;

            if (report.getValue('gender') === Enum.EGender.male) {
                dwellTimeRanges[currLevel].maleTotal += 1;
                dwellTimeRanges[currLevel].maleRanges[ageIndex] += 1;

                if (isEmployee) {
                    dwellTimeRanges[currLevel].maleEmployeeTotal += 1;
                    dwellTimeRanges[currLevel].maleEmployeeRanges[ageIndex] += 1;
                }
            } else {
                dwellTimeRanges[currLevel].femaleTotal += 1;
                dwellTimeRanges[currLevel].femaleRanges[ageIndex] += 1;

                if (isEmployee) {
                    dwellTimeRanges[currLevel].femaleEmployeeTotal += 1;
                    dwellTimeRanges[currLevel].femaleEmployeeRanges[ageIndex] += 1;
                }
            }

            if (!!prevReport) {
                dwellTimeRanges[prevReport.dwellTimeLevel].total -= 1;

                if (report.getValue('gender') === Enum.EGender.male) {
                    dwellTimeRanges[prevReport.dwellTimeLevel].maleTotal -= 1;
                    dwellTimeRanges[prevReport.dwellTimeLevel].maleRanges[ageIndex] -= 1;

                    if (isEmployee) {
                        dwellTimeRanges[prevReport.dwellTimeLevel].maleEmployeeTotal -= 1;
                        dwellTimeRanges[prevReport.dwellTimeLevel].maleEmployeeRanges[ageIndex] -= 1;
                    }
                } else {
                    dwellTimeRanges[prevReport.dwellTimeLevel].femaleTotal -= 1;
                    dwellTimeRanges[prevReport.dwellTimeLevel].femaleRanges[ageIndex] -= 1;

                    if (isEmployee) {
                        dwellTimeRanges[prevReport.dwellTimeLevel].femaleEmployeeTotal -= 1;
                        dwellTimeRanges[prevReport.dwellTimeLevel].femaleEmployeeRanges[ageIndex] -= 1;
                    }
                }
            }

            return dwellTimeRanges;
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
    private async SaveReportSummary(report: IDB.ReportDwellTime, prevReport: Partial<IDB.IReportDwellTime>, type: Enum.ESummaryType): Promise<void> {
        try {
            let date: Date = DateTime.Type2Date(report.getValue('date'), type);

            let reportSummary: IDB.ReportDwellTimeSummary = await new Parse.Query(IDB.ReportDwellTimeSummary)
                .equalTo('device', report.getValue('device'))
                .equalTo('type', type)
                .equalTo('date', date)
                .first()
                .fail((e) => {
                    throw e;
                });

            let currLevel: number = report.getValue('dwellTimeLevel');
            let ranges: number[] = reportSummary ? reportSummary.getValue('totalRanges') : new Array(this._ageRanges.length).fill(0);
            ranges[currLevel] += 1;

            if (reportSummary) {
                if (!!prevReport) {
                    ranges[prevReport.dwellTimeLevel] -= 1;
                    reportSummary.setValue('total', reportSummary.getValue('total') - prevReport.dwellTimeSecond);
                } else {
                    reportSummary.setValue('count', reportSummary.getValue('count') + 1);
                }

                reportSummary.setValue('total', reportSummary.getValue('total') + report.getValue('dwellTimeSecond'));
                reportSummary.setValue('totalRanges', ranges);
                reportSummary.setValue('dwellTimeRanges', this.GenerateDwellTimeRanges(report, reportSummary, prevReport));
            } else {
                reportSummary = new IDB.ReportDwellTimeSummary();

                reportSummary.setValue('site', report.getValue('site'));
                reportSummary.setValue('area', report.getValue('area'));
                reportSummary.setValue('device', report.getValue('device'));
                reportSummary.setValue('type', type);
                reportSummary.setValue('date', date);
                reportSummary.setValue('total', report.getValue('dwellTimeSecond'));
                reportSummary.setValue('count', 1);
                reportSummary.setValue('totalRanges', ranges);
                reportSummary.setValue('dwellTimeRanges', this.GenerateDwellTimeRanges(report, reportSummary, prevReport));
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

                            let report: IDB.ReportDwellTime = await new Parse.Query(IDB.ReportDwellTime)
                                .equalTo('faceId', x.faceId)
                                .descending('date')
                                .first()
                                .fail((e) => {
                                    throw e;
                                });

                            if (isIn && (!report || !!report.getValue('outDate'))) {
                                report = new IDB.ReportDwellTime();

                                report.setValue('inDate', x.base.date);
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

                                await report.save(null, { useMasterKey: true }).fail((e) => {
                                    throw e;
                                });

                                let imageSrc: string = `images_report/dwell_time/${DateTime.ToString(report.createdAt, 'YYYYMMDD')}/${report.id}_report_${report.createdAt.getTime()}.${this._imageConfig.isTransparent ? 'png' : 'jpeg'}`;
                                File.WriteFile(`${File.assetsPath}/${imageSrc}`, buffer);

                                report.setValue('imageSrc', imageSrc);

                                await report.save(null, { useMasterKey: true }).fail((e) => {
                                    throw e;
                                });
                            }

                            if (!!report && !isIn) {
                                let prevReport: Partial<IDB.IReportDwellTime> = undefined;
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
