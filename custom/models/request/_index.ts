import * as IConfig from './config';
import * as ILicense from './license';
import * as ILocation from './location';
import * as ISetting from './setting';
import * as ITag from './tag';
import * as IUser from './user';

export { IConfig, ILicense, ILocation, ISetting, ITag, IUser };

export interface IPaging {
    page?: number;
    pageSize?: number;
}

export interface IDataList {
    paging?: IPaging;
}

export interface IMultiData {
    datas: any[];
}

export interface IDelete {
    objectId: string | string[];
}
