import * as ICamera from './camera';
import * as IConfig from './config';
import * as ILicense from './license';
import * as ILocation from './location';
import * as IUser from './user';

export { ICamera, IConfig, ILicense, ILocation, IUser };

export interface IDataList {
    page?: number;
    count?: number;
}
