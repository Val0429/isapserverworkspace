export interface IIndexR {
    analyst?: 'ISap' | 'Yolo3';
}

export interface IGroupR {
    analyst: 'ISap' | 'Yolo3';
    date?: Date;
    count?: number;
}

export interface ISummaryR extends IGroupR {
    type: 'month' | 'day' | 'hour';
}
