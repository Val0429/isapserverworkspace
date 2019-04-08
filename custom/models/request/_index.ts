import * as ICamera from './camera';
import * as IConfig from './config';
import * as ILocation from './location';
import * as IUser from './user';

export { IConfig, ILocation, ICamera, IUser };

export interface IDataList {
    page?: number;
    count?: number;
}
