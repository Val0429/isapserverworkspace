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
    status: Enum.ReceiveStatus;
    memo: string;
    notificateCount: number;
    adjustReason: string;
}

export interface IReceiveIndexR extends IReceiveIndexBase {
    barcode: string;
    barcodeSrc: string;
    packageReceiveId: string;
}

export interface IReturnIndexC {
    packageReturnId: string;
}

export interface IReturnIndexR extends IReceiveIndexBase {
    barcode: string;
    barcodeSrc: string;
    packageReturnId: string;
    receiverSrc: string;
}

export interface IPostingIndexC {
    packagePostingId: string;
}

export interface IPostingIndexR extends IReceiveIndexBase {
    packagePostingId: string;
    packageSrc: string;
    senderSrc: string;
}
