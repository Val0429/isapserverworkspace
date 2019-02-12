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

export interface IGroupR_Data extends IData {}

export interface IGroupR {
    camera: string;
    date: Date;
    type: string;
    datas: IGroupR_Data[];
}
