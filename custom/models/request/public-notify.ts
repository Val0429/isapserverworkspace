export interface IIndexBase {
    date: Date;
    title: string;
    content: string;
    attachment?: string;
    extension?: string;
}

export interface IIndexC extends IIndexBase {}

export interface IIndexR {
    start?: Date;
    end?: Date;
}

export interface IIndexU extends IIndexBase {
    publicNotifyId: string;
}

export interface IIndexD {
    publicNotifyIds: string | string[];
}
