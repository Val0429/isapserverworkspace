import * as IOccupancy from './occupancy';

export { IOccupancy };

export interface IDataList<T> {
    total: number;
    page: number;
    count: number;
    content: T;
}
