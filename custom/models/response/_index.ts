import * as IConfig from './config';
import * as IDevice from './device';
import * as IEvent from './event';
import * as ILicense from './license';
import * as ILocation from './location';
import * as IOfficeHour from './office-hour';
import * as IPartner from './partner';
import * as IReport from './report';
import * as IRule from './rule';
import * as ISetting from './setting';
import * as ITag from './tag';
import * as IUser from './user';

export { IConfig, IDevice, IEvent, ILicense, ILocation, IOfficeHour, IPartner, IReport, IRule, ISetting, ITag, IUser };

export interface IPaging {
    total: number;
    totalPages: number;
    page: number;
    pageSize: number;
}

export interface IDataList<T> {
    paging: IPaging;
    results: T[];
}

export interface IResponseMessage {
    statusCode: number;
    objectId: string;
    message: string;
}

export interface IMultiData {
    datas: IResponseMessage[];
}

export interface IObject {
    objectId: string;
    name: string;
}
