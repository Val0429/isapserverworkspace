import * as IConfig from './config';
import * as IUser from './user';

export { IConfig, IUser };

export interface IDataList<T> {
    total: number;
    page: number;
    count: number;
    content: T;
}
