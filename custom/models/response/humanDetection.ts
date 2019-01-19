export interface IData {
    objectId: string;
    name?: string;
    count: number;
    source: string;
    src: string;
    date: Date;
}

export interface IChartR {
    name: string;
    datas: IData[];
}
