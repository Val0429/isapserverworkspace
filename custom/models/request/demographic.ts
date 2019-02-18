export interface IIndexR {
    analyst?: 'ISap';
    type?: 'month' | 'day' | 'hour';
    gender?: 'male' | 'female';
}

export interface ISummaryR {
    analyst: 'ISap';
    type: 'month' | 'day' | 'hour';
    date?: Date;
    count?: number;
}
