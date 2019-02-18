import * as IConfig from './config';
import * as IDemographic from './demographic';
import * as IFaceCount from './faceCount';
import * as IOccupancy from './occupancy';
import * as IPrinter from './printer';

export { IConfig, IDemographic, IFaceCount, IOccupancy, IPrinter };

export interface IDataList {
    page?: number;
    count?: number;
}
