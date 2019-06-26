import { IUser, Action, Restful, RoleList, Errors, Socket } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../custom/models';
import { Print, Utility } from '../../custom/helpers';
import * as Enum from '../../custom/enums';

let action = new Action({
    loginRequired: true,
    permission: [],
});

export default action;

export class Report {
    /**
     *
     */
    protected _collection: string = '';

    /**
     *
     */
    protected _sites: IDB.LocationSite[] = [];

    /**
     *
     */
    protected _type: Enum.ESummaryType = Enum.ESummaryType.hour;

    /**
     *
     */
    private _startDate: Date = new Date();
    protected get startDate(): Date {
        return new Date(this._startDate);
    }

    /**
     *
     */
    private _endDate: Date = new Date();
    protected get endDate(): Date {
        return new Date(this._endDate);
    }

    /**
     *
     */
    protected _officeHours: IDB.OfficeHour[] = [];

    /**
     *
     */
    protected _weathers: IDB.Weather[] = [];

    /**
     * Initialization
     */
    public async Initialization(input: IRequest.IReport.ISummaryBase, userSiteIds: string[]): Promise<void> {
        try {
            this._sites = await this.GetAllowSite(userSiteIds, input.siteIds, input.tagIds);
            this._startDate = new Date(new Date(input.startDate).setHours(0, 0, 0, 0));
            this._endDate = new Date(new Date(new Date(input.endDate).setDate(input.endDate.getDate() + 1)).setHours(0, 0, 0, 0));
            this._type = input.type;

            this._officeHours = await this.GetOfficeHour();

            this._weathers = await this.GetWeather();
        } catch (e) {
            throw e;
        }
    }

    /**
     *  Get allow site
     * @param userSiteIds
     * @param siteIds
     * @param tagIds
     */
    public async GetAllowSite(userSiteIds: string[], siteIds: string[], tagIds: string[]): Promise<IDB.LocationSite[]> {
        try {
            let tags: IDB.Tag[] = await new Parse.Query(IDB.Tag)
                .containedIn('objectId', tagIds)
                .find()
                .fail((e) => {
                    throw e;
                });

            let allowSiteIds: string[] = siteIds
                .filter((value, index, array) => {
                    return userSiteIds.indexOf(value) > -1;
                })
                .filter((value, index, array) => {
                    return tags.every((value1, index1, array1) => {
                        return (
                            value1.getValue('sites').findIndex((value2, index2, array2) => {
                                return value2.id === value;
                            }) > -1
                        );
                    });
                });

            let sites: IDB.LocationSite[] = await new Parse.Query(IDB.LocationSite)
                .containedIn('objectId', allowSiteIds)
                .find()
                .fail((e) => {
                    throw e;
                });

            return sites;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Get type date
     * @param date
     */
    public GetTypeDate(date: Date): Date {
        try {
            date = new Date(date);
            switch (this._type) {
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

            return date;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Get report summary
     * @param startDate
     * @param endDate
     */
    public async GetReportSummary<T extends Parse.Object>(): Promise<T[]>;
    public async GetReportSummary<T extends Parse.Object>(startDate: Date, endDate: Date): Promise<T[]>;
    public async GetReportSummary<T extends Parse.Object>(startDate?: Date, endDate?: Date): Promise<T[]> {
        try {
            startDate = startDate || this.startDate;
            endDate = endDate || this.endDate;

            let reportSummaryQuery: Parse.Query = new Parse.Query(this._collection)
                .equalTo('type', Enum.ESummaryType.hour)
                .containedIn('site', this._sites)
                .greaterThanOrEqualTo('date', startDate)
                .lessThan('date', endDate);

            let reportSummaryTotal: number = await reportSummaryQuery.count();

            let reportSummarys: Parse.Object[] = await reportSummaryQuery
                .limit(reportSummaryTotal)
                .ascending(['date'])
                .include(['site', 'area', 'device', 'device.groups'])
                .find()
                .fail((e) => {
                    throw e;
                });

            reportSummarys = this.OfficeHourFilter(reportSummarys);

            return reportSummarys as T[];
        } catch (e) {
            throw e;
        }
    }

    /**
     * Get office hour
     */
    public async GetOfficeHour(): Promise<IDB.OfficeHour[]> {
        try {
            let officeHours: IDB.OfficeHour[] = await new Parse.Query(IDB.OfficeHour)
                .containedIn('sites', this._sites)
                .find()
                .fail((e) => {
                    throw e;
                });

            return officeHours;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Get weather
     * @param startDate
     * @param endDate
     */
    public async GetWeather(): Promise<IDB.Weather[]>;
    public async GetWeather(startDate: Date, endDate: Date): Promise<IDB.Weather[]>;
    public async GetWeather(startDate?: Date, endDate?: Date): Promise<IDB.Weather[]> {
        try {
            startDate = startDate || this.startDate;
            endDate = endDate || this.endDate;

            if (this._type === Enum.ESummaryType.hour) {
                return [];
            }

            let weatherQuery: Parse.Query<IDB.Weather> = new Parse.Query(IDB.Weather)
                .containedIn('site', this._sites)
                .greaterThanOrEqualTo('date', startDate)
                .lessThan('date', endDate);

            let weatherTotal: number = await weatherQuery.count();

            let weatherRecord: IDB.Weather[] = await weatherQuery
                .limit(weatherTotal)
                .find()
                .fail((e) => {
                    throw e;
                });

            return weatherRecord;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Get sales record
     * @param startDate
     * @param endDate
     */
    public async GetSalesRecord(): Promise<IDB.ReportSalesRecord[]>;
    public async GetSalesRecord(startDate: Date, endDate: Date): Promise<IDB.ReportSalesRecord[]>;
    public async GetSalesRecord(startDate?: Date, endDate?: Date): Promise<IDB.ReportSalesRecord[]> {
        try {
            startDate = startDate || this.startDate;
            endDate = endDate || this.endDate;

            let recordQuery: Parse.Query<IDB.ReportSalesRecord> = new Parse.Query(IDB.ReportSalesRecord)
                .containedIn('site', this._sites)
                .greaterThanOrEqualTo('date', startDate)
                .lessThan('date', endDate);

            let recordTotal: number = await recordQuery.count();

            let salesRecord: IDB.ReportSalesRecord[] = await recordQuery
                .limit(recordTotal)
                .find()
                .fail((e) => {
                    throw e;
                });

            salesRecord = this.OfficeHourFilter(salesRecord);

            return salesRecord;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Office hour filter
     * @param datas
     */
    public OfficeHourFilter<T extends Parse.Object>(datas: T[]): T[] {
        try {
            datas = datas.filter((value, index, array) => {
                let date: Date = value.get('date');
                let day: number = date.getDay();
                let hour: number = new Date(date).setFullYear(2000, 0, 1);

                return !!this._officeHours.find((value1, index1, array1) => {
                    return !!value1.getValue('dayRanges').find((value2, index2, array2) => {
                        let startDay: number = parseInt(value2.startDay);
                        let endDay: number = value2.endDay === '0' ? 7 : parseInt(value2.endDay);
                        let startDate: number = value2.startDate.getTime();
                        let endDate: number = value2.endDate.getTime();

                        return startDay <= day && day <= endDay && startDate <= hour && hour < endDate;
                    });
                });
            });

            return datas;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Get summary data base attr
     * @param data
     */
    public GetSummaryDataBase(data: any): IResponse.IReport.ISummaryDataBase {
        try {
            let date: Date = this.GetTypeDate(data.getValue('date'));

            let site: IResponse.IObject = {
                objectId: data.getValue('site').id,
                name: data.getValue('site').getValue('name'),
            };

            let area: IResponse.IObject = {
                objectId: data.getValue('area').id,
                name: data.getValue('area').getValue('name'),
            };

            let device: IResponse.IObject = {
                objectId: data.getValue('device').id,
                name: data.getValue('device').getValue('name'),
            };

            let deviceGroups: IResponse.IObject[] = (data.getValue('device').getValue('groups') || []).map((value1, index1, array1) => {
                return {
                    objectId: value1.id,
                    name: value1.getValue('name'),
                };
            });

            let weather: IDB.Weather = this._weathers.find((value1, index1, array1) => {
                return value1.getValue('site').id === data.getValue('site').id && value1.getValue('date').getTime() === date.getTime();
            });
            let summaryWeather: IResponse.IReport.ISummaryWeather = weather
                ? {
                      icon: weather.getValue('icon'),
                      temperatureMin: weather.getValue('temperatureMin'),
                      temperatureMax: weather.getValue('temperatureMax'),
                  }
                : undefined;

            let base: IResponse.IReport.ISummaryDataBase = {
                site: site,
                area: area,
                device: device,
                deviceGroups: deviceGroups,
                date: date,
                type: Enum.ESummaryType[this._type],
                weather: summaryWeather,
            };

            return base;
        } catch (e) {
            throw e;
        }
    }
}
