import * as IConfig from './config';
import * as ILicense from './license';
import * as ILocation from './location';
import * as IUser from './user';

export { IConfig, ILicense, ILocation, IUser };

export interface IPaging {
    page?: number;
    pageSize?: number;
}

export interface IDataList {
    paging?: IPaging;
}
