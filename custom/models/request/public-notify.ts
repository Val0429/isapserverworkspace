export interface IIndexBase {
    date: Date;
    title: string;
    content: string;
}

export interface IIndexC extends IIndexBase {
    attachment: string;
    extension: string;
}

export interface IIndexR {
    start?: Date;
    end?: Date;
}

export interface IIndexU extends IIndexBase {
    publicNotifyId: string;
    attachment?: string;
    extension?: string;
}

export interface IIndexD {
    publicNotifyIds: string | string[];
}
