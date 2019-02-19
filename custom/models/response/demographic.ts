export interface IHuman {
    name: string;
    src: string;
    age: number;
    gender: string;
    date: Date;
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
    humans: IHuman[];
}

export interface ISummaryR_Data extends IData {
    humans: IHuman[];
}

export interface ISummaryR {
    camera: string;
    range: string;
    date: Date;
    type: string;
    datas: ISummaryR_Data[];
}
