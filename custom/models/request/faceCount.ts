export interface IIndexR {
    analyst?: 'ISap';
    type?: 'month' | 'day' | 'hour';
}

export interface IGroupR {
    analyst: 'ISap';
    type: 'month' | 'day' | 'hour';
    date?: Date;
    count?: number;
}
