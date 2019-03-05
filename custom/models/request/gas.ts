export interface IIndexC {
    date: Date;
    deadline: Date;
}

export interface IIndexR {
    date?: Date;
    status: 'all' | 'filled' | 'unfilled' | 'overdue';
}

export interface IIndexU {
    gasId: string;
    degree: number;
}
