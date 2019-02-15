export interface IIndexR {
    analyst?: 'ISap';
    type?: 'month' | 'day' | 'hour';
}

export interface ISummaryR {
    analyst: 'ISap';
    type: 'month' | 'day' | 'hour';
    date?: Date;
    count?: number;
}
