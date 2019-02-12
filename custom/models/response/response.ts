import * as IFaceCount from './faceCount';
import * as IOccupancy from './occupancy';

export { IFaceCount, IOccupancy };

export interface IDataList<T> {
    total: number;
    page: number;
    count: number;
    content: T;
}
