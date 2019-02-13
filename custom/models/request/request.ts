import * as IFaceCount from './faceCount';
import * as IOccupancy from './occupancy';
import * as IPrinter from './printer';

export { IFaceCount, IOccupancy, IPrinter };

export interface IDataList {
    page?: number;
    count?: number;
}
