import * as IClient from './client';
import * as IConfig from './config';
import * as ILicense from './license';
import * as ILocation from './location';
import * as INotify from './notify';
import * as IPerson from './person';
import * as ISetting from './setting';
import * as IUser from './user';

export { IClient, IConfig, ILicense, ILocation, INotify, IPerson, ISetting, IUser };

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
