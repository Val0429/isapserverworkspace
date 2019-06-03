import * as IConfig from './config';
import * as IEvent from './event';
import * as ILicense from './license';
import * as ILocation from './location';
import * as IOfficeHour from './office-hour';
import * as IPartner from './partner';
import * as ISetting from './setting';
import * as ITag from './tag';
import * as IUser from './user';

export { IConfig, IEvent, ILicense, ILocation, IOfficeHour, IPartner, ISetting, ITag, IUser };

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

export interface IMultiData {
    statusCode: number;
    objectId: string;
    message: string;
}

export interface IObject {
    objectId: string;
    name: string;
}
