import * as Enum from '../../enums';

export interface IIndexC {
    publicArticleId: string;
}

export interface IIndexR {
    publicArticleId: string;
    date: Date;
    name: string;
    type: string;
    defaultCount: number;
    adjustCount: number;
    adjustReason: string;
    adjusterName: string;
    lendCount: number;
}

export interface IAll {
    publicArticleId: string;
    name: string;
    type: string;
    lessCount: number;
}

export interface IReservationC {
    reservationId: string;
}

export interface IReservationR {
    reservationId: string;
    articleId: string;
    articleName: string;
    articleType: string;
    articleLessCount: number;
    residentId: string;
    residentname: string;
    residentAddress: string;
    lendCount: number;
    lendDate: Date;
    replierName: string;
    replyDate: Date;
    status: Enum.ReceiveStatus;
}
