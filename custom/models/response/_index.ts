import * as IConfig from './config';
import * as IDemographic from './demographic';
import * as IFaceCount from './faceCount';
import * as IOccupancy from './occupancy';
import * as IUser from './user';

export { IConfig, IDemographic, IFaceCount, IOccupancy, IUser };

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
