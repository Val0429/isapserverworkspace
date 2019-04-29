import * as IConfig from './config';
import * as ILicense from './license';
import * as ISetting from './setting';
import * as IUser from './user';

export { IConfig, ILicense, ISetting, IUser };

export interface IPaging {
    page?: number;
    pageSize?: number;
}

export interface IDataList {
    paging?: IPaging;
}
