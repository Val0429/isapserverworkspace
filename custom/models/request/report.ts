export interface ISalesRecordC {
    siteId: string;
    date: Date;
    revenue: number;
    transaction: number;
}

export interface ISalesRecordR {
    siteId?: string;
    date?: Date;
}

export interface ISalesRecordU {
    objectId: string;
    revenue?: number;
    transaction?: number;
}
