export interface IIndexR {
    analyst?: 'ISap' | 'Yolo3';
}

export interface IChartR {
    analyst: 'ISap' | 'Yolo3';
    frequency: 'none' | 'month' | 'day' | 'hour';
    date?: Date;
    count?: number;
}
