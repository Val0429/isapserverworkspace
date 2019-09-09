import * as IConfig from './config';
import * as ILicense from './license';
import * as ILocation from './location';
import * as ISetting from './setting';
import * as IUser from './user';

export { IConfig, ILicense, ILocation, ISetting, IUser };

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
