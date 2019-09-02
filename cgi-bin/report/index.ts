import { IUser, Action, Restful, RoleList, Errors, Socket, IBase } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../custom/models';
import { Print, Utility, DateTime } from '../../custom/helpers';
import * as Enum from '../../custom/enums';

let action = new Action({
    loginRequired: true,
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
    private _siteIds: Report.IPublicData<string[]> = undefined;
    public get siteIds(): string[] {
        if (!this._siteIds || this._siteIds.initTime < this._initTime) {
            let data = this._sites.map((value, index, array) => {
                return value.id;
            });

            this._siteIds = {
                initTime: new Date().getTime(),
                data: data,
            };
        }

        return JSON.parse(JSON.stringify(this._siteIds.data));
    }

    /**
     *
     */
    private _sitesIdDictionary: Report.IPublicData<IBase.IObject.IKeyValueObject> = undefined;
    public get sitesIdDictionary(): IBase.IObject.IKeyValueObject {
        if (!this._sitesIdDictionary || this._sitesIdDictionary.initTime < this._initTime) {
            let data = {};
            this._sites.forEach((value, index, array) => {
                let key: string = value.id;

                data[key] = {
                    objectId: key,
                    name: value.getValue('name'),
                };
            });

            this._sitesIdDictionary = {
                initTime: new Date().getTime(),
                data: data,
            };
        }

        return JSON.parse(JSON.stringify(this._sitesIdDictionary.data));
    }

    /**
     *
     */
    private _type: Enum.ESummaryType = Enum.ESummaryType.hour;
    public get type(): Enum.ESummaryType {
        return this._type;
    }

    /**
     *
     */
    private _currDateRange: IBase.IDate.IRange = {
        startDate: new Date(),
        endDate: new Date(),
    };
    public get currDateRange(): IBase.IDate.IRange {
        return {
            startDate: new Date(this._currDateRange.startDate),
            endDate: new Date(this._currDateRange.endDate),
        };
    }

    /**
     *
     */
    private _prevDateRange: IBase.IDate.IRange = {
        startDate: new Date(),
        endDate: new Date(),
    };
    public get prevDateRange(): IBase.IDate.IRange {
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

    /**
     *
     */
    private _summaryOfficeHours: Report.IPublicData<IResponse.IReport.ISummaryOfficeHour[]> = undefined;
    public get summaryOfficeHours(): IResponse.IReport.ISummaryOfficeHour[] {
        if (!this._summaryOfficeHours || this._summaryOfficeHours.initTime < this._initTime) {
            let data = this._officeHours.map<IResponse.IReport.ISummaryOfficeHour>((value, index, array) => {
                let sites: IResponse.IObject[] = (value.getValue('sites') || []).map((value1, index1, array1) => {
                    return this.sitesIdDictionary[value1.id];
                });

                return {
                    objectId: value.id,
                    name: value.getValue('name'),
                    dayRanges: value.getValue('dayRanges'),
                    sites: sites,
                };
            });

            this._summaryOfficeHours = {
                initTime: new Date().getTime(),
                data: data,
            };
        }

        return JSON.parse(JSON.stringify(this._summaryOfficeHours.data));
    }

    /**
     *
     */
    private _weathers: IDB.Weather[] = [];

    /**
     *
     */
    private _summaryWeathers: Report.IPublicData<IResponse.IReport.ISummaryWeather[]> = undefined;
    public get summaryWeathers(): IResponse.IReport.ISummaryWeather[] {
        if (!this._summaryWeathers || this._summaryWeathers.initTime < this._initTime) {
            let data = this._weathers.map<IResponse.IReport.ISummaryWeather>((value, index, array) => {
                let site: IResponse.IObject = this.sitesIdDictionary[value.getValue('site').id];

                return {
                    site: site,
                    date: value.getValue('date'),
                    icon: value.getValue('icon'),
                    temperatureMin: value.getValue('temperatureMin'),
                    temperatureMax: value.getValue('temperatureMax'),
                };
            });

            this._summaryWeathers = {
                initTime: new Date().getTime(),
                data: data,
            };
        }

        return JSON.parse(JSON.stringify(this._summaryWeathers.data));
    }

    /**
     *
     */
    private _devices: IDB.Device[] = [];

    /**
     *
     */
    private _devicesIdDictionary: IBase.IObject.IKeyValue<IDB.Device> = undefined;
    public get devicesIdDictionary(): IBase.IObject.IKeyValue<IDB.Device> {
        if (!this._devicesIdDictionary) {
            this._devicesIdDictionary = {};

            this._devices.forEach((value, index, array) => {
                let key: string = value.id;

                this._devicesIdDictionary[key] = value;
            });
        }

        return this._devicesIdDictionary;
    }

    /**
     *
     */
    private _initTime: number = 0;
    protected get initTime(): number {
        return this._initTime;
    }

    /**
     * Initialization
     * @param input
     * @param userSiteIds
     */
    public async Initialization(input: IRequest.IReport.ISummaryBase, userSiteIds: string[], option?: Report.IInitOption): Promise<void> {
        try {
            option = {
                ...{
                    useOfficeHour: true,
                    useWeather: true,
                },
                ...option,
            };

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

            this._sites = await this.GetAllowSites(userSiteIds, input.siteIds, input.tagIds);

            let tasks = [];

            if (option.useOfficeHour) {
                tasks.push(
                    (async () => {
                        this._officeHours = await this.GetOfficeHours();
                    })(),
                );
            }

            if (option.useWeather) {
                tasks.push(
                    (async () => {
                        this._weathers = await this.GetWeathers();
                    })(),
                );
            }

            await Promise.all(tasks);

            this._initTime = new Date().getTime();
        } catch (e) {
            throw e;
        }
    }

    /**
     * Dispose class
     */
    public Dispose(): void {
        try {
            this._devices.length = 0;
            this._officeHours.length = 0;
            this._sites.length = 0;
            this._weathers.length = 0;

            this._devicesIdDictionary = null;
            this._siteIds = null;
            this._sitesIdDictionary = null;
            this._summaryOfficeHours = null;
            this._summaryWeathers = null;
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
     * @param type
     */
    public GetTypeDate(date: Date): Date;
    public GetTypeDate(date: Date, type: Enum.ESummaryType): Date;
    public GetTypeDate(date: Date, type?: Enum.ESummaryType): Date {
        try {
            type = type || this._type;

            return DateTime.Type2Date(date, type);
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
                // .equalTo('type', Enum.ESummaryType.hour)
                .containedIn('site', this._sites)
                .greaterThanOrEqualTo('date', startDate)
                .lessThan('date', endDate);

            let reportTotal: number = await reportQuery.count();

            let reports: Parse.Object[] = await reportQuery
                .limit(reportTotal)
                // .ascending(['date'])
                .include(includes)
                .find()
                .fail((e) => {
                    throw e;
                });

            reports = this.OfficeHourFilter(reports);

            let deviceIds: string[] = reports
                .map((value, index, array) => {
                    return value.get('device').id;
                })
                .filter((value, index, array) => {
                    return array.indexOf(value) === index;
                });

            let devices: IDB.Device[] = await new Parse.Query(IDB.Device)
                .containedIn('objectId', deviceIds)
                .include(['site', 'area', 'groups'])
                .find()
                .fail((e) => {
                    throw e;
                });

            this._devices.push(...devices);
            this._devicesIdDictionary = undefined;

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
                .find()
                .fail((e) => {
                    throw e;
                });

            officeHours.forEach((value, index, array) => {
                let sites = value.getValue('sites').filter((value1, index1, array1) => {
                    return this.siteIds.indexOf(value1.id) > -1;
                });

                value.setValue('sites', sites);
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

            let salesRecordsSiteDateDictionary: object = {};
            salesRecords.forEach((value, index, array) => {
                let key: string = value.getValue('site').id;
                let key1: string = this.GetTypeDate(value.getValue('date')).toISOString();

                if (!salesRecordsSiteDateDictionary[key]) {
                    salesRecordsSiteDateDictionary[key] = {};
                }
                if (!salesRecordsSiteDateDictionary[key][key1]) {
                    salesRecordsSiteDateDictionary[key][key1] = [];
                }

                salesRecordsSiteDateDictionary[key][key1].push(value);
            });

            salesRecords.length = 0;

            let reportsSiteDateDictionary: object = {};
            reports.forEach((value, index, array) => {
                let key: string = value.getValue('site').id;
                let key1: string = this.GetTypeDate(value.getValue('date')).toISOString();

                if (!reportsSiteDateDictionary[key]) {
                    reportsSiteDateDictionary[key] = {};
                }
                if (!reportsSiteDateDictionary[key][key1]) {
                    reportsSiteDateDictionary[key][key1] = [];
                }

                reportsSiteDateDictionary[key][key1].push(value);
            });

            let summarys = new Array<IResponse.IReport.ISalesRecordSummaryData>().concat(
                ...Object.keys(this.sitesIdDictionary).map((value, index, array) => {
                    let site = this.sitesIdDictionary[value];

                    return dates.map<IResponse.IReport.ISalesRecordSummaryData>((value1, index1, array1) => {
                        return {
                            site: site,
                            date: value1,
                            revenue: 0,
                            transaction: 0,
                            traffic: 0,
                        };
                    });
                }),
            );
            summarys = summarys.map<IResponse.IReport.ISalesRecordSummaryData>((value, index, array) => {
                let salesRecord = {
                    revenue: 0,
                    transaction: 0,
                };
                ((salesRecordsSiteDateDictionary[value.site.objectId] || {})[value.date.toISOString()] || []).forEach((value1, index1, array1) => {
                    salesRecord.revenue += value1.getValue('revenue');
                    salesRecord.transaction += value1.getValue('transaction');
                });

                let traffic: number = 0;
                ((reportsSiteDateDictionary[value.site.objectId] || {})[value.date.toISOString()] || []).forEach((value1, index1, array1) => {
                    traffic += value1.getValue('in') - (value1.getValue('inEmployee') || 0);
                });

                return {
                    site: value.site,
                    date: value.date,
                    revenue: salesRecord.revenue,
                    transaction: salesRecord.transaction,
                    traffic: traffic,
                };
            });

            salesRecordsSiteDateDictionary = null;
            reportsSiteDateDictionary = null;

            return summarys;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Get Dwell Time Summary range datas
     * @param reports
     */
    public async GetDwellTimeSummaryRangeDatas(): Promise<IResponse.IReport.IDwellTimeSummaryRangeData[]>;
    public async GetDwellTimeSummaryRangeDatas(reports: IDB.ReportDwellTimeSummary[]): Promise<IResponse.IReport.IDwellTimeSummaryRangeData[]>;
    public async GetDwellTimeSummaryRangeDatas(reports?: IDB.ReportDwellTimeSummary[]): Promise<IResponse.IReport.IDwellTimeSummaryRangeData[]> {
        try {
            if (!reports) {
                reports = await this.GetReports(IDB.ReportDwellTimeSummary, []);
            }

            let summarys: IResponse.IReport.IDwellTimeSummaryRangeData[] = undefined;
            reports.forEach((value, index, array) => {
                let dwellTimeRanges = value.getValue('dwellTimeRanges');

                if (!summarys) {
                    summarys = dwellTimeRanges;
                } else {
                    summarys.forEach((value1, index1, array1) => {
                        let dwellTimeRange = dwellTimeRanges[index1];

                        value1.total += dwellTimeRange.total;
                        value1.maleTotal += dwellTimeRange.maleTotal;
                        value1.maleEmployeeTotal += dwellTimeRange.maleEmployeeTotal;
                        value1.maleRanges = Utility.MerageArray(value1.maleRanges, dwellTimeRange.maleRanges);
                        value1.maleEmployeeRanges = Utility.MerageArray(value1.maleEmployeeRanges, dwellTimeRange.maleEmployeeRanges);
                        value1.femaleTotal += dwellTimeRange.femaleTotal;
                        value1.femaleEmployeeTotal += dwellTimeRange.femaleEmployeeTotal;
                        value1.femaleRanges = Utility.MerageArray(value1.femaleRanges, dwellTimeRange.femaleRanges);
                        value1.femaleEmployeeRanges = Utility.MerageArray(value1.femaleEmployeeRanges, dwellTimeRange.femaleEmployeeRanges);
                    });
                }
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
                let site: IDB.LocationSite = value.get('site');

                return !!this._officeHours.find((value1, index1, array1) => {
                    let siteIds: string[] = value1.getValue('sites').map((value2, index2, array2) => {
                        return value2.id;
                    });

                    return (
                        siteIds.indexOf(site.id) > -1 &&
                        !!value1.getValue('dayRanges').find((value2, index2, array2) => {
                            let startDay: number = parseInt(value2.startDay);
                            let endDay: number = value2.endDay === '0' ? 7 : parseInt(value2.endDay);
                            let days = Array.from({ length: endDay - startDay + 1 }, (i, j) => (j + startDay === 7 ? 0 : j + startDay));

                            let startDate: number = value2.startDate.getTime();
                            let endDate: number = value2.endDate.getTime();

                            return days.indexOf(day) > -1 && startDate <= hour && hour < endDate;
                        })
                    );
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

            let _device = this.devicesIdDictionary[data.getValue('device').id];

            let site: IResponse.IObject = {
                objectId: _device.getValue('site').id,
                name: _device.getValue('site').getValue('name'),
            };

            let area: IResponse.IObject = {
                objectId: _device.getValue('area').id,
                name: _device.getValue('area').getValue('name'),
            };

            let device: IResponse.IObject = {
                objectId: _device.id,
                name: _device.getValue('name'),
            };

            let deviceGroups: IResponse.IObject[] = (_device.getValue('groups') || []).map((value1, index1, array1) => {
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
                type: Enum.ESummaryType[this.type],
            };

            return base;
        } catch (e) {
            throw e;
        }
    }
}

export namespace Report {
    /**
     *
     */
    export interface IPublicData<T> {
        initTime: number;
        data: T;
    }

    /**
     *
     */
    export interface IInitOption {
        useOfficeHour?: boolean;
        useWeather?: boolean;
    }
}
