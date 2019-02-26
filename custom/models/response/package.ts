import * as Enum from '../../enums';

export interface IReceiveIndexC {
    packageReceiveId: string;
}

export interface IReceiveIndexR {
    packageReceiveId: string;
    residentId: string;
    date: Date;
    address: string;
    sender: string;
    receiver: string;
    barcode: string;
    status: Enum.ReceiveStatus;
    memo: string;
    notificateCount: number;
    adjustReason: string;
}
