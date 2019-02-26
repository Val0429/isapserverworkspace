import * as Enum from '../../enums';

export interface IReceiveIndexBase {
    residentId: string;
    sender: string;
    receiver: string;
    memo: string;
}

export interface IReceiveIndexC extends IReceiveIndexBase {
    barcode: string;
}

export interface IReceiveIndexR {
    start?: Date;
    end?: Date;
    status?: Enum.ReceiveStatus;
}

export interface IReceiveIndexU extends IReceiveIndexBase {
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
    packageReturnId: string;
    adjustReason: string;
}

export interface IReturnReceive extends IReceiveReceiveBase {
    packageReturnId: string;
}
