import * as Enum from '../../enums';

export interface IReceiveIndexBase {
    sender: string;
    receiver: string;
    memo: string;
}

export interface IReceiveIndexC extends IReceiveIndexBase {
    residentId: string;
    barcode: string;
}

export interface IReceiveIndexR {
    start?: Date;
    end?: Date;
    status?: Enum.ReceiveStatus;
}

export interface IReceiveIndexU extends IReceiveIndexBase {
    residentId: string;
    packageReceiveId: string;
    adjustReason: string;
}

export interface IReceiveReceiveBase {
    packageBarcode: string;
    residentBarcode: string;
    memo: string;
}

export interface IReceiveReceive extends IReceiveReceiveBase {
    packageReceiveId: string;
}

export interface IReturnIndexU extends IReceiveIndexBase {
    residentId: string;
    packageReturnId: string;
    adjustReason: string;
}

export interface IReturnReceive extends IReceiveReceiveBase {
    packageReturnId: string;
}

export interface IPostingIndexU extends IReceiveIndexBase {
    residentId: string;
    packagePostingId: string;
    adjustReason: string;
}

export interface IPostingResidentC extends IReceiveIndexBase {
    residentBarcode: string;
    packageImage: string;
}

export interface IPostingResidentReceive {
    packagePostingId: string;
    residentBarcode: string;
    memo: string;
}

export interface IPostingVisitorC extends IReceiveIndexBase {
    residentId: string;
    packageImage: string;
    senderImage: string;
}

export interface IPostingVisitorReceive {
    packagePostingId: string;
    memo: string;
    receiverImage: string;
}
