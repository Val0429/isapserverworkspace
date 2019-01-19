import * as IHumanDetection from './humanDetection';

export { IHumanDetection };

export interface IDataList<T> {
    total: number;
    page: number;
    count: number;
    content: T;
}
