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
    private _sites: IDB.LocationSite[] = [];

    /**
     *
     */
    protected _type: Enum.ESummaryType = Enum.ESummaryType.hour;
    public get type(): string {
        return Enum.ESummaryType[this._type];
    }

    /**
     *
     */
    private _currDateRange: IDB.IDateRange = {
        startDate: new Date(),
        endDate: new Date(),
    };
    public get currDateRange(): IDB.IDateRange {
        return {
            startDate: new Date(this._currDateRange.startDate),
            endDate: new Date(this._currDateRange.endDate),
        };
    }

    /**
     *
     */
    private _prevDateRange: IDB.IDateRange = {
        startDate: new Date(),
        endDate: new Date(),
    };
    public get prevDateRange(): IDB.IDateRange {
        return {
            startDate: new Date(this._prevDateRange.startDate),
            endDate: new Date(this._prevDateRange.endDate),
        };
    }

    /**
     *
     */
    private _dateGap: number = 0;
    public get dateGap(): number {
        return this._dateGap;
    }

    /**
     *
     */
    private _officeHours: IDB.OfficeHour[] = [];
    public get officeHours(): IResponse.IReport.ISummaryOfficeHour[] {
        let officeHours = this._officeHours.map<IResponse.IReport.ISummaryOfficeHour>((value, index, array) => {
            let sites: IResponse.IObject[] = (value.getValue('sites') || []).map((value1, index1, array1) => {
                return {
                    objectId: value1.id,
                    name: value1.getValue('name'),
                };
            });

            return {
                objectId: value.id,
                name: value.getValue('name'),
                dayRanges: value.getValue('dayRanges'),
                sites: sites,
            };
        });

        return officeHours;
    }

    /**
     *
     */
    private _weathers: IDB.Weather[] = [];
    public get weathers(): IResponse.IReport.ISummaryWeather[] {
        let weathers = this._weathers.map<IResponse.IReport.ISummaryWeather>((value, index, array) => {
            let site: IResponse.IObject = {
                objectId: value.getValue('site').id,
                name: value.getValue('site').getValue('name'),
            };

            return {
                site: site,
                date: value.getValue('date'),
                icon: value.getValue('icon'),
                temperatureMin: value.getValue('temperatureMin'),
                temperatureMax: value.getValue('temperatureMax'),
            };
        });

        return weathers;
    }

    /**
     * Initialization
     * @param input
     * @param userSiteIds
     */
    public async Initialization(input: IRequest.IReport.ISummaryBase, userSiteIds: string[]): Promise<void> {
        try {
            this._sites = await this.GetAllowSites(userSiteIds, input.siteIds, input.tagIds);

            this._type = input.type;

            this._currDateRange = {
                startDate: new Date(input.startDate),
                endDate: new Date(new Date(input.endDate).setDate(input.endDate.getDate() + 1)),
            };

            this._dateGap = this.currDateRange.endDate.getTime() - this.currDateRange.startDate.getTime();

            this._prevDateRange = {
                startDate: new Date(this.currDateRange.startDate.getTime() - this._dateGap),
                endDate: new Date(this.currDateRange.startDate),
            };

            let tasks = [];

            tasks.push(
                (async () => {
                    this._officeHours = await this.GetOfficeHours();
                })(),
            );

            tasks.push(
                (async () => {
                    this._weathers = await this.GetWeathers();
                })(),
            );

            await Promise.all(tasks);
        } catch (e) {
            throw e;
        }
    }

    /**
     * Get allow site
     * @param userSiteIds
     * @param siteIds
     * @param tagIds
     */
    public async GetAllowSites(userSiteIds: string[], siteIds: string[], tagIds: string[]): Promise<IDB.LocationSite[]> {
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
     * Get report
     * @param collection
     * @param includes
     * @param startDate
     * @param endDate
     */

    public async GetReports<T extends Parse.Object>(collection: new () => T, includes: string[]): Promise<T[]>;
    public async GetReports<T extends Parse.Object>(collection: new () => T, includes: string[], startDate: Date, endDate: Date): Promise<T[]>;
    public async GetReports<T extends Parse.Object>(collection: new () => T, includes: string[], startDate?: Date, endDate?: Date): Promise<T[]> {
        try {
            startDate = startDate || this.currDateRange.startDate;
            endDate = endDate || this.currDateRange.endDate;

            let reportQuery: Parse.Query = new Parse.Query(collection)
                .equalTo('type', Enum.ESummaryType.hour)
                .containedIn('site', this._sites)
                .greaterThanOrEqualTo('date', startDate)
                .lessThan('date', endDate);

            let reportTotal: number = await reportQuery.count();

            let reports: Parse.Object[] = await reportQuery
                .limit(reportTotal)
                .ascending(['date'])
                .include(['site', 'area', 'device', 'device.groups', ...includes])
                .find()
                .fail((e) => {
                    throw e;
                });

            reports = this.OfficeHourFilter(reports);

            return reports as T[];
        } catch (e) {
            throw e;
        }
    }

    /**
     * Get office hour
     */
    public async GetOfficeHours(): Promise<IDB.OfficeHour[]> {
        try {
            let officeHours: IDB.OfficeHour[] = await new Parse.Query(IDB.OfficeHour)
                .containedIn('sites', this._sites)
                .include('sites')
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
    public async GetWeathers(): Promise<IDB.Weather[]>;
    public async GetWeathers(startDate: Date, endDate: Date): Promise<IDB.Weather[]>;
    public async GetWeathers(startDate?: Date, endDate?: Date): Promise<IDB.Weather[]> {
        try {
            startDate = startDate || this.currDateRange.startDate;
            endDate = endDate || this.currDateRange.endDate;

            let weatherQuery: Parse.Query<IDB.Weather> = new Parse.Query(IDB.Weather)
                .containedIn('site', this._sites)
                .greaterThanOrEqualTo('date', startDate)
                .lessThan('date', endDate);

            let weatherTotal: number = await weatherQuery.count();

            let weatherRecord: IDB.Weather[] = await weatherQuery
                .limit(weatherTotal)
                .include('site')
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
    public async GetSalesRecords(): Promise<IDB.ReportSalesRecord[]>;
    public async GetSalesRecords(startDate: Date, endDate: Date): Promise<IDB.ReportSalesRecord[]>;
    public async GetSalesRecords(startDate?: Date, endDate?: Date): Promise<IDB.ReportSalesRecord[]> {
        try {
            startDate = startDate || this.currDateRange.startDate;
            endDate = endDate || this.currDateRange.endDate;

            let recordQuery: Parse.Query<IDB.ReportSalesRecord> = new Parse.Query(IDB.ReportSalesRecord)
                .containedIn('site', this._sites)
                .greaterThanOrEqualTo('date', startDate)
                .lessThan('date', endDate);

            let recordTotal: number = await recordQuery.count();

            let salesRecord: IDB.ReportSalesRecord[] = await recordQuery
                .limit(recordTotal)
                .include('site')
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
     * Get sales record summary
     * @param reports
     */
    public async GetSalesRecordSummarys(): Promise<IResponse.IReport.ISalesRecordSummaryData[]>;
    public async GetSalesRecordSummarys(reports: IDB.ReportPeopleCountingSummary[]): Promise<IResponse.IReport.ISalesRecordSummaryData[]>;
    public async GetSalesRecordSummarys(reports?: IDB.ReportPeopleCountingSummary[]): Promise<IResponse.IReport.ISalesRecordSummaryData[]> {
        try {
            if (!reports) {
                reports = await this.GetReports(IDB.ReportPeopleCountingSummary, []);
            }

            let salesRecords = await this.GetSalesRecords();

            let dates: Date[] = []
                .concat(reports, salesRecords)
                .map((value, index, array) => {
                    let date: Date = this.GetTypeDate(value.get('date'));

                    return date;
                })
                .filter((value, index, array) => {
                    return (
                        array.findIndex((value1, index1, array1) => {
                            return value1.getTime() === value.getTime();
                        }) === index
                    );
                });

            let sites = this._sites.map<IResponse.IObject>((value, index, array) => {
                return {
                    objectId: value.id,
                    name: value.getValue('name'),
                };
            });

            let summarys = new Array<IResponse.IReport.ISalesRecordSummaryData>().concat(
                ...sites.map((value, index, array) => {
                    return dates.map<IResponse.IReport.ISalesRecordSummaryData>((value1, index1, array1) => {
                        return {
                            site: value,
                            date: value1,
                            revenue: 0,
                            transaction: 0,
                            traffic: 0,
                        };
                    });
                }),
            );

            summarys = summarys.map<IResponse.IReport.ISalesRecordSummaryData>((value, index, array) => {
                let salesRecord = salesRecords
                    .filter((value1, index1, array1) => {
                        return value1.getValue('site').id === value.site.objectId && this.GetTypeDate(value1.getValue('date')).getTime() === value.date.getTime();
                    })
                    .reduce(
                        (prev1, curr1, index1, array1) => {
                            prev1.revenue += curr1.getValue('revenue');
                            prev1.transaction += curr1.getValue('transaction');

                            return prev1;
                        },
                        {
                            revenue: 0,
                            transaction: 0,
                        },
                    );

                let traffic = reports
                    .filter((value1, index1, array1) => {
                        let date: Date = this.GetTypeDate(value1.getValue('date'));

                        return value1.getValue('site').id === value.site.objectId && date.getTime() === value.date.getTime();
                    })
                    .reduce<number>((prev1, curr1, index1, array1) => {
                        return prev1 + curr1.getValue('in') - (curr1.getValue('inEmployee') || 0);
                    }, 0);

                return {
                    site: value.site,
                    date: value.date,
                    revenue: salesRecord.revenue,
                    transaction: salesRecord.transaction,
                    traffic: traffic,
                };
            });

            return summarys;
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
     * Get base summary data attr
     * @param data
     */
    public GetBaseSummaryData(data: any): IResponse.IReport.ISummaryDataBase {
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

            let base: IResponse.IReport.ISummaryDataBase = {
                site: site,
                area: area,
                device: device,
                deviceGroups: deviceGroups,
                date: date,
                type: this.type,
            };

            return base;
        } catch (e) {
            throw e;
        }
    }
}
