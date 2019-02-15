export interface IData {
    objectId: string;
    analyst: string;
    date: Date;
    total: number;
}

export interface IIndexR extends IData {
    type: string;
    camera: string;
}

export interface ISummaryR_Data extends IData {}

export interface ISummaryR {
    camera: string;
    date: Date;
    type: string;
    datas: ISummaryR_Data[];
}
