import * as IConfig from './config';

export { IConfig };

export interface IDataList<T> {
    total: number;
    page: number;
    count: number;
    content: T;
}
