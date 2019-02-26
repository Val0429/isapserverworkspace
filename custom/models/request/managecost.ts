export interface IIndexC {
    date: Date;
    deadline: Date;
}

export interface IIndexR {
    date: Date;
    status: 'all' | 'received' | 'unreceived' | 'overdue';
}

export interface IPayment {
    manageCostId: string;
    cost: number;
}
