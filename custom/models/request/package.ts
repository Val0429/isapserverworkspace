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

export interface IReceiveReceive {
    packageReceiveId: string;
    packageReceiveBarcode: string;
    residentBarcode: string;
    memo: string;
}
