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

            this.EnableLiveStream();
        } catch (e) {
            Print.Log(e, new Error(), 'error');
        }
    }

    /**
     * Save report summary
     * @param report
     * @param type
     */
    private async SaveReportSummary(report: IDB.ReportDemographic, type: Enum.ESummaryType): Promise<void> {
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

            let isEmployee: boolean = report.getValue('isEmployee');

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

                            let report: IDB.ReportDemographic = new IDB.ReportDemographic();

                            report.setValue('site', x.base.site);
                            report.setValue('area', x.base.area);
                            report.setValue('device', x.base.device);
                            report.setValue('date', x.base.date);
                            report.setValue('imageSrc', '');
                            report.setValue('age', x.feature.age);
                            report.setValue('gender', x.feature.gender === Enum.EGender[Enum.EGender.male] ? Enum.EGender.male : Enum.EGender.female);
                            report.setValue('isEmployee', isEmployee);
                            report.setValue('userGroups', x.groups);

                            await report.save(null, { useMasterKey: true }).fail((e) => {
                                throw e;
                            });

                            let imageSrc: string = `images_report/demographic/${DateTime.ToString(report.createdAt, 'YYYYMMDD')}/${report.id}_report_${report.createdAt.getTime()}.${this._imageConfig.isTransparent ? 'png' : 'jpeg'}`;
                            File.WriteFile(`${File.assetsPath}/${imageSrc}`, buffer);

                            report.setValue('imageSrc', imageSrc);

                            let tasks: Promise<any>[] = [];

                            tasks.push(report.save(null, { useMasterKey: true }) as any);
                            tasks.push(this.SaveReportSummary(report, Enum.ESummaryType.hour));
                            // tasks.push(this.SaveReportSummary(report, Enum.ESummaryType.day));
                            // tasks.push(this.SaveReportSummary(report, Enum.ESummaryType.month));
                            // tasks.push(this.SaveReportSummary(report, Enum.ESummaryType.season));

                            await Promise.all(tasks).catch((e) => {
                                throw e;
                            });
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
        groups: Enum.EPeopleType[];
    }
}
