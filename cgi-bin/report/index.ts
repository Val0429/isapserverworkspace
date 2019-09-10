import { IUser, Action, Restful, RoleList, Errors, Socket, IBase } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../custom/models';
import { Print, Utility, DateTime } from '../../custom/helpers';
import * as Enum from '../../custom/enums';

let action = new Action({
    loginRequired: true,
});

export default action;

/**
 * Base
 */
class Base {
    /**
     *
     */
    protected _mode: Enum.EDeviceMode = undefined;
    public get mode(): Enum.EDeviceMode {
        return this._mode;
    }
    public set mode(value: Enum.EDeviceMode) {
        this._mode = value;
    }

    /**
     *
     */
    protected _sites: IDB.LocationSite[] = [];

    /**
     *
     */
    protected _siteIds: Report.IPublicData<string[]> = undefined;
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
    protected _sitesIdDictionary: Report.IPublicData<IBase.IObject.IKeyValueObject> = undefined;
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
    protected _devices: IDB.Device[] = [];

    /**
     *
     */
    protected _devicesIdDictionary: Report.IPublicData<IBase.IObject.IKeyValue<IDB.Device>> = undefined;
    public get devicesIdDictionary(): IBase.IObject.IKeyValue<IDB.Device> {
        if (!this._devicesIdDictionary || this._devicesIdDictionary.initTime < this._initTime) {
            let data = {};
            this._devices.forEach((value, index, array) => {
                let key: string = value.id;

                data[key] = value;
            });

            this._devicesIdDictionary = {
                initTime: new Date().getTime(),
                data: data,
            };
        }

        return this._devicesIdDictionary.data;
    }

    /**
     *
     */
    protected _officeHours: IDB.OfficeHour[] = [];

    /**
     *
     */
    protected _isEnableOfficeHour: boolean = true;
    public get isEnableOfficeHour(): boolean {
        return this._isEnableOfficeHour;
    }
    public set isEnableOfficeHour(value: boolean) {
        this._isEnableOfficeHour = value;
    }

    /**
     *
     */
    protected _summaryOfficeHours: Report.IPublicData<IResponse.IReport.ISummaryOfficeHour[]> = undefined;
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
    protected _weathers: IDB.Weather[] = [];

    /**
     *
     */
    protected _isEnableWeather: boolean = true;
    public get isEnableWeather(): boolean {
        return this._isEnableWeather;
    }
    public set isEnableWeather(value: boolean) {
        this._isEnableWeather = value;
    }

    /**
     *
     */
    protected _summaryWeathers: ReportSummary.IPublicData<IResponse.IReport.ISummaryWeather[]> = undefined;
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
    protected _initTime: number = 0;
    protected get initTime(): number {
        return this._initTime;
    }

    /**
     * Dispose class
     */
    public Dispose(): void {
        try {
            this._devices.length = 0;
            this._officeHours.length = 0;
            this._sites.length = 0;

            this._devicesIdDictionary = null;
            this._siteIds = null;
            this._sitesIdDictionary = null;
            this._summaryOfficeHours = null;
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
    protected async GetAllowSites(userSiteIds: string[], siteIds: string[], tagIds: string[]): Promise<IDB.LocationSite[]> {
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
     * Get report
     * @param collection
     * @param includes
     * @param startDate
     * @param endDate
     * @param paging
     */
    protected async GetReport<T extends Parse.Object>(collection: new () => T, includes: string[], startDate: Date, endDate: Date): Promise<Report.IReportResponse<T>>;
    protected async GetReport<T extends Parse.Object>(collection: new () => T, includes: string[], startDate: Date, endDate: Date, paging: IRequest.IPaging): Promise<Report.IReportResponse<T>>;
    protected async GetReport<T extends Parse.Object>(collection: new () => T, includes: string[], startDate: Date, endDate: Date, paging?: IRequest.IPaging): Promise<Report.IReportResponse<T>> {
        try {
            let reportQuery: Parse.Query = new Parse.Query(collection)
                .containedIn('device', this._devices)
                .greaterThanOrEqualTo('date', startDate)
                .lessThan('date', endDate);

            let reportTotal: number = await reportQuery.count();

            if (!!paging) {
                let page: number = paging.page || 1;
                let pageSize: number = paging.pageSize || 10;

                reportQuery.skip((page - 1) * pageSize).limit(pageSize);
            } else {
                reportQuery.limit(reportTotal);
            }

            let reports: Parse.Object[] = await reportQuery
                .include(includes)
                .find()
                .fail((e) => {
                    throw e;
                });

            reports = this.OfficeHourFilter(reports);

            return {
                total: reportTotal,
                reports: reports as T[],
            };
        } catch (e) {
            throw e;
        }
    }

    /**
     * Get office hour
     */
    protected async GetOfficeHours(): Promise<IDB.OfficeHour[]> {
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
    protected async GetWeathers(startDate: Date, endDate: Date): Promise<IDB.Weather[]> {
        try {
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
     * Office hour filter
     * @param datas
     */
    protected OfficeHourFilter<T extends Parse.Object>(datas: T[]): T[] {
        try {
            if (this._isEnableOfficeHour) {
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
            }

            return datas;
        } catch (e) {
            throw e;
        }
    }
}

/**
 * Report Summary
 */
export class Report extends Base {
    /**
     * Initialization
     * @param input
     * @param userSiteIds
     */
    public async Initialization(input: IRequest.IReport.IIndexBase, userSiteIds: string[]): Promise<void> {
        try {
            this._sites = await this.GetAllowSites(userSiteIds, [input.siteId], []);

            let tasks = [];

            tasks.push(
                (async () => {
                    let query: Parse.Query<IDB.Device> = new Parse.Query(IDB.Device).containedIn('site', this._sites);

                    if ('areaId' in input) {
                        let area: IDB.LocationArea = await new Parse.Query(IDB.LocationArea)
                            .equalTo('objectId', input.areaId)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (!area) {
                            throw Errors.throw(Errors.CustomBadRequest, ['area not found']);
                        }

                        query.equalTo('area', area);
                    }
                    if ('deviceGroupId' in input) {
                        let group: IDB.DeviceGroup = await new Parse.Query(IDB.DeviceGroup)
                            .equalTo('objectId', input.deviceGroupId)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (!group) {
                            throw Errors.throw(Errors.CustomBadRequest, ['device group not found']);
                        }

                        query.containedIn('groups', [group]);
                    }
                    if ('deviceId' in input) {
                        query.equalTo('objectId', input.deviceId);
                    }

                    let count: number = await query.count().fail((e) => {
                        throw e;
                    });

                    this._devices = await query
                        .limit(count)
                        .include(['site', 'area', 'groups'])
                        .find()
                        .fail((e) => {
                            throw e;
                        });
                })(),
            );

            if (this._isEnableOfficeHour) {
                tasks.push(
                    (async () => {
                        this._officeHours = await this.GetOfficeHours();
                    })(),
                );
            }

            if (this._isEnableWeather) {
                tasks.push(
                    (async () => {
                        this._weathers = await this.GetWeathers(input.startDate, input.endDate);
                    })(),
                );
            }

            await Promise.all(tasks);

            this._initTime = new Date().getTime();
        } catch (e) {
            throw e;
        }
    }
}

/**
 * Report Summary
 */
export class ReportSummary extends Base {
    /**
     *
     */
    protected _type: Enum.ESummaryType = Enum.ESummaryType.hour;
    public get type(): Enum.ESummaryType {
        return this._type;
    }

    /**
     *
     */
    protected _currDateRange: IBase.IDate.IRange = {
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
    protected _prevDateRange: IBase.IDate.IRange = {
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
    protected _dateGap: number = 0;
    public get dateGap(): number {
        return this._dateGap;
    }

    /**
     * Initialization
     * @param input
     * @param userSiteIds
     */
    public async Initialization(input: IRequest.IReport.ISummaryBase, userSiteIds: string[]): Promise<void> {
        try {
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

            tasks.push(
                (async () => {
                    this._devices = await this.GetDevices();
                })(),
            );

            if (this._isEnableOfficeHour) {
                tasks.push(
                    (async () => {
                        this._officeHours = await this.GetOfficeHours();
                    })(),
                );
            }

            if (this._isEnableWeather) {
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
            this._weathers.length = 0;

            this._summaryWeathers = null;

            super.Dispose();
        } catch (e) {
            throw e;
        }
    }

    /**
     * Get Deivces
     */
    public async GetDevices(): Promise<IDB.Device[]> {
        try {
            let query: Parse.Query<IDB.Device> = new Parse.Query(IDB.Device).containedIn('site', this._sites);

            if (!!this._mode) {
                query.equalTo('mode', this._mode);
            }

            let devices: IDB.Device[] = await query
                .include(['site', 'area', 'groups'])
                .find()
                .fail((e) => {
                    throw e;
                });

            return devices;
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

            let { reports } = await super.GetReport(collection, includes, startDate, endDate);

            return reports;
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

            let weathers = await super.GetWeathers(startDate, endDate);

            return weathers;
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
    export interface IReportResponse<T> {
        total: number;
        reports: T[];
    }
}

export namespace ReportSummary {
    /**
     *
     */
    export interface IPublicData<T> {
        initTime: number;
        data: T;
    }
}