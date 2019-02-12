import * as IFaceCount from './faceCount';
import * as IOccupancy from './occupancy';

export { IFaceCount, IOccupancy };

export interface IDataList {
    page?: number;
    count?: number;
}
