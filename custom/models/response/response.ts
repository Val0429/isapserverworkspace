export {};

export interface IDataList<T> {
    total: number;
    page: number;
    count: number;
    content: T;
}
