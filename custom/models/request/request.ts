import * as IConfig from './config';
import * as IUser from './user';

export { IConfig, IUser };

export interface IDataList {
    page?: number;
    count?: number;
}
