import { RoleList } from 'core/cgi-package';
import * as Enum from '../../enums';

interface IUser {
    account: string;
    password: string;
}

export interface IBaseIndexC extends IUser {
    roles: RoleList[];
}

export interface IBaseIndexD {
    userId: string;
}

export interface IBaseLogin {
    account: string;
    password: string;
}

export interface IBaseLogout {
    sessionId: string;
}

export interface IBasePasswordU {
    userId?: string;
    previous: string;
    current: string;
}

export interface ICommitteeIndexC extends IUser {
    name: string;
    roles: (RoleList.Chairman | RoleList.DeputyChairman | RoleList.DirectorGeneral | RoleList.FinanceCommittee | RoleList.Guard)[];
}

export interface ICommitteeIndexU {
    userId: string;
    passwordPrevious?: string;
    passwordCurrent?: string;
    adjustReason: string;
}

export interface ICommitteeIndexD {
    userIds: string | string[];
}

export interface IResidentIndexC {
    address: string;
    parkingId?: string;
    manageCost: number;
    pointTotal: number;
    character: Enum.ResidentCharacter;
}

export interface IResidentInfoIndexC extends IUser {
    barcode: string;
    name: string;
    gender: Enum.Gender;
    birthday: Date;
    phone?: string;
    lineId?: string;
    email?: string;
    education?: string;
    career?: string;
}

export interface IResidentInfoIndexR {
    redsidentId: string;
}

export interface IResidentInfoIndexU {
    userId: string;
    phone: string;
    lineId: string;
    email: string;
    education: string;
    career: string;
}

export interface IResidentInfoIndexD {
    userIds: string | string[];
}
