import * as IConfig from './config';
import * as IParking from './parking';
import * as IUser from './user';

export { IConfig, IParking, IUser };

export interface IDataList<T> {
    total: number;
    page: number;
    count: number;
    content: T;
}
