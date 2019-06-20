export interface ISalesRecordC {
    customId: string;
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
