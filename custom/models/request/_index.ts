import * as IConfig from './config';
// import * as IDevice from './device';
// import * as IEvent from './event';
// import * as ILicense from './license';
import * as ILocation from './location';
// import * as IOfficeHour from './office-hour';
// import * as IPartner from './partner';
// import * as ISetting from './setting';
import * as ITag from './tag';
import * as IUser from './user';

// export { IConfig, IDevice, IEvent, ILicense, ILocation, IOfficeHour, IPartner, ISetting, ITag, IUser };
export { IConfig, ILocation, ITag, IUser };

export interface IPaging {
    page?: number;
    pageSize?: number;
}

export interface IDataList {
    paging?: IPaging;
    objectId?: string;
    keyword?: string;
}

export interface IMultiData {
    datas: any[];
}

export interface IDelete {
    objectId: string | string[];
}
