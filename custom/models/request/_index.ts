import * as ICamera from './camera';
import * as IConfig from './config';
import * as ILicense from './license';
import * as ILocation from './location';
import * as IReport from './report';
import * as ISetting from './setting';
import * as IUser from './user';

export { ICamera, IConfig, ILicense, ILocation, IReport, ISetting, IUser };

export interface IPaging {
    page?: number;
    pageSize?: number;
}

export interface IDataList {
    paging?: IPaging;
}
