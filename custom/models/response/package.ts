import * as Enum from '../../enums';

export interface IReceiveIndexC {
    packageReceiveId: string;
}

export interface IReceiveIndexBase {
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

export interface IReceiveIndexR extends IReceiveIndexBase {
    packageReceiveId: string;
}

export interface IReturnIndexC {
    packageReturnId: string;
}

export interface IReturnIndexR extends IReceiveIndexBase {
    packageReturnId: string;
}
