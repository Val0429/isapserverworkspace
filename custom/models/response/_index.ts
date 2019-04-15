import * as IConfig from './config';
import * as ILicense from './license';
import * as IUser from './user';

export { IConfig, ILicense, IUser };

export interface IDataList<T> {
    total: number;
    page: number;
    count: number;
    content: T;
}
