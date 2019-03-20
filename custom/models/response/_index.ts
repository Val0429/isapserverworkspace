import * as IConfig from './config';
import * as IDemographic from './demographic';
import * as IFaceCount from './faceCount';
import * as IOccupancy from './occupancy';
import * as IUser from './user';

export { IConfig, IDemographic, IFaceCount, IOccupancy, IUser };

export interface IDataList<T> {
    total: number;
    page: number;
    count: number;
    content: T;
}
