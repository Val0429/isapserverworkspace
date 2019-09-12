import * as IClient from './client';
import * as IConfig from './config';
import * as ILicense from './license';
import * as ILocation from './location';
import * as IPerson from './person';
import * as ISetting from './setting';
import * as IUser from './user';

export { IClient, IConfig, ILicense, ILocation, IPerson, ISetting, IUser };

export interface IPaging {
    page?: number;
    pageSize?: number;
}

export interface IDataList {
    paging?: IPaging;
    objectId?: string;
    keyword?: string;
}

export interface IMultiData {
    datas: any[];
}

export interface IDelete {
    objectId: string | string[];
}
