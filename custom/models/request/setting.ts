import * as Enum from '../../enums';

export interface ILPRU {
    broadcastIp: string;
    broadcastPort: number;
}

export interface ILPRCheck extends ILPRU {}

export interface ILPRNameListC {
    type: Enum.EIdentificationType.white | Enum.EIdentificationType.black;
    name: string;
}

export interface ILPRNameListR {
    type?: Enum.EIdentificationType.white | Enum.EIdentificationType.black;
}

export interface ILPRNameListU {
    objectId: string;
    name?: string;
}

export interface ILPRNameListD {
    objectId: string;
}
