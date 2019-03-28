export interface IIndexC {
    residentId: string;
    visitorImage: string;
    visitorName: string;
    visitorCount: number;
    purpose: string;
    memo: string;
}

export interface IIndexR {
    start?: Date;
    end?: Date;
    divideMinute?: number;
    status: 'all' | 'prev' | 'curr';
}

export interface IIndexD {
    visitorIds: string | string[];
}

export interface ILeave {
    visitorId: string;
}
