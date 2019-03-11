import { RoleList } from 'core/cgi-package';
import * as Enum from '../../enums';

export interface IBaseIndexC {
    userId: string;
}

export interface IBaseIndexR {
    userId: string;
    account: string;
    roles: RoleList[];
}

export interface IBaseLogin {
    sessionId: string;
    userId: string;
    roles: string[];
    serverTime: Date;
}

export interface ICommitteeIndexR extends IBaseIndexR {
    adjustReason: string;
    name: string;
}

export interface ICommitteeLogin extends IBaseLogin {
    communityName: string;
    communityAddress: string;
}

export interface IResidentIndexC {
    residentId: string;
}

export interface IResidentIndexR {
    residentId: string;
    address: string;
    residentCount: number;
    parkingCost: number;
    manageCost: number;
    pointTotal: number;
    pointBalance: number;
    barcode: string;
}

export interface IResidentAll {
    redsidentId: string;
    address: string;
    barcode: string;
}

export interface IResidentInfoIndexC {
    userId: string;
}

export interface IResidentInfoIndexR {
    userId: string;
    name: string;
    gender: Enum.Gender;
    birthday: Date;
    phone: string;
    lineId: string;
    email: string;
    education: string;
    career: string;
    character: Enum.ResidentCharacter;
    isEmail: boolean;
    isNotice: boolean;
}

export interface IResidentLogin extends IResidentInfoIndexR {
    sessionId: string;
    residentId: string;
    barcode: string;
    communityName: string;
    communityAddress: string;
}
