export interface IIndexBase {
    title: string;
    content: string;
    extension?: string;
    attachment?: string;
}

export interface IIndexC extends IIndexBase {
    residentId: string;
}

export interface IIndexR {
    start?: Date;
    end?: Date;
    status: 'all' | 'received' | 'unreceived';
}

export interface IIndexU extends IIndexBase {
    listenId: string;
    replyContent: string;
}

export interface IIndexD {
    listenIds: string | string[];
}

export interface IReceive {
    listenId: string;
    replyContent: string;
}
