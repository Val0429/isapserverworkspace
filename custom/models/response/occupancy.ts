export interface IData {
    objectId: string;
    analyst: string;
    date: Date;
}

export interface IIndexR extends IData {
    camera: string;
    count: number;
    src: string;
}

export interface IGroupR_Data extends IData {
    count: number;
    src: string;
}

export interface IGroupR {
    camera: string;
    date: Date;
    datas: IGroupR_Data[];
}

export interface ISummaryR_Data extends IData {
    total: number;
}

export interface ISummaryR {
    camera: string;
    date: Date;
    datas: ISummaryR_Data[];
}
