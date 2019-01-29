export interface IData {
    objectId: string;
    analyst: string;
    camera?: string;
    count: number;
    src: string;
    date: Date;
}

export interface IChartR {
    camera: string;
    date: Date;
    datas: IData[];
}
