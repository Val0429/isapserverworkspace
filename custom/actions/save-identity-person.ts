import { Config } from 'core/config.gen';
import * as Rx from 'rxjs';
import { IDB } from '../models';
import { Print, Draw, DateTime, File, Utility } from '../helpers';
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
    private _config = Config.deviceRepeatVisitor;

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
            this.EnableLiveStream();
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
                .zip(next$.startWith(0))
                .map((x) => {
                    return x[0];
                })
                .subscribe({
                    next: async (x) => {
                        let buffer: Buffer = x.buffer;

                        try {
                            let isEmployee = (x.groups || []).indexOf(Enum.EPeopleType.employee) > -1;
                            let isIn = x.base.device.getValue('direction') === Enum.EDeviceDirection.in;

                            let report: IDB.ReportIdentityPerson = await new Parse.Query(IDB.ReportIdentityPerson)
                                .equalTo('faceId', x.faceId)
                                .descending('date')
                                .first()
                                .fail((e) => {
                                    throw e;
                                });

                            if (isIn && (!report || !!report.getValue('outDate'))) {
                                report = new IDB.ReportIdentityPerson();

                                report.setValue('inDate', x.base.date);
                                report.setValue('site', x.base.site);
                                report.setValue('area', x.base.area);
                                report.setValue('device', x.base.device);
                                report.setValue('date', x.base.date);
                                report.setValue('imageSrc', '');
                                report.setValue('userGroups', x.groups);
                                report.setValue('faceId', x.faceId);
                                report.setValue('name', x.name);

                                await report.save(null, { useMasterKey: true }).fail((e) => {
                                    throw e;
                                });

                                if (this._config.output.saveSource) {
                                    File.WriteFile(`${File.assetsPath}/images_report_source/identity_person/${DateTime.ToString(report.createdAt, 'YYYYMMDD')}/${report.id}_report_${report.createdAt.getTime()}.bmp`, buffer);
                                }

                                buffer = await Draw.Resize(buffer, this._imageSize, this._imageConfig.isFill, this._imageConfig.isTransparent);

                                let imageSrc: string = `images_report/identity_person/${DateTime.ToString(report.createdAt, 'YYYYMMDD')}/${report.id}_report_${report.createdAt.getTime()}.${this._imageConfig.isTransparent ? 'png' : 'jpeg'}`;
                                File.WriteFile(`${File.assetsPath}/${imageSrc}`, buffer);

                                report.setValue('imageSrc', imageSrc);

                                await report.save(null, { useMasterKey: true }).fail((e) => {
                                    throw e;
                                });
                            }

                            if (!!report && !isIn) {
                                report.setValue('outDate', x.base.date);

                                let second: number = Utility.Round((report.getValue('outDate').getTime() - report.getValue('inDate').getTime()) / 1000, 0);

                                report.setValue('dwellTimeSecond', second);

                                await report.save(null, { useMasterKey: true }).fail((e) => {
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
        faceId: string;
        name: string;
        groups: Enum.EPeopleType[];
    }
}
