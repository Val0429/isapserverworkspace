import * as IConfig from './config';
import * as ILicense from './license';
import * as ISetting from './setting';
import * as IUser from './user';

export { IConfig, ILicense, ISetting, IUser };

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
