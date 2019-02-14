import * as IConfig from './config';
import * as IFaceCount from './faceCount';
import * as IOccupancy from './occupancy';
import * as IPrinter from './printer';

export { IConfig, IFaceCount, IOccupancy };

export interface IDataList {
    page?: number;
    count?: number;
}
