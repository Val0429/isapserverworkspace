import * as IConfig from './config';
import * as IDemographic from './demographic';
import * as IFaceCount from './faceCount';
import * as IOccupancy from './occupancy';
import * as IPrinter from './printer';
import * as IUser from './user';

export { IConfig, IDemographic, IFaceCount, IOccupancy, IPrinter, IUser };

export interface IDataList {
    page?: number;
    count?: number;
}
