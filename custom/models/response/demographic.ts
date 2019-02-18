export interface IHuman {
    name: string;
    src: string;
    age: number;
    gender: string;
}

export interface IData {
    objectId: string;
    analyst: string;
    date: Date;
    total: number;
    male: number;
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
