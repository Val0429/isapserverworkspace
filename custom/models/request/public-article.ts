export interface IIndexC {
    name: string;
    type: string;
    defaultCount: number;
}

export interface IIndexR {
    type?: string;
}

export interface IIndexU {
    publicArticleId: string;
    name: string;
    adjustCount: number;
    adjustReason: string;
}

export interface IIndexD {
    publicArticleIds: string | string[];
}

export interface IReservationC {
    publicArticleId: string;
    residentId: string;
    lendCount: number;
}

export interface IReservationR {
    date: Date;
    publicArticleId?: string;
    status: 'all' | 'received' | 'unreceived';
}

export interface IReservationU {
    reservationId: string;
    count: number;
}

export interface IReservationD {
    reservationIds: string | string[];
}
