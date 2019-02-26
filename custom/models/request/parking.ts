export interface IIndexC {
    name: string;
    cost: number;
}

export interface IIndexD {
    parkingIds: string[];
}

export interface IAll {
    status: 'all' | 'used' | 'unused';
}
