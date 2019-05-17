import { RoleList } from 'core/cgi-package';
import * as Enum from '../../enums';

interface IUser {
    account: string;
    password: string;
}

export interface IBaseIndexC extends IUser {
    roles: RoleList[];
}

export interface IBaseIndexU {
    userId: string;
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
    role: RoleList.Chairman | RoleList.DeputyChairman | RoleList.DirectorGeneral | RoleList.FinanceCommittee | RoleList.Guard;
}

export interface ICommitteeIndexU {
    userId: string;
    password?: string;
    adjustReason: string;
}

export interface ICommitteeIndexD {
    userIds: string | string[];
}

export interface IResidentIndexC {
    address: string;
    parkingIds?: string[];
    manageCost: number;
    pointTotal: number;
}

export interface IResidentIndexD {
    residentIds: string | string[];
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
    deviceToken: string;
    deviceType: 'android' | 'ios';
}

export interface IResidentInfoIndexR {
    redsidentId: string;
}

export interface IResidentInfoIndexU {
    userId?: string;
    phone: string;
    lineId: string;
    email: string;
    education: string;
    career: string;
    isEmail: boolean;
    isNotice: boolean;
}

export interface IResidentInfoIndexD {
    userIds: string | string[];
}

export interface IResidentCharacter {
    userId: string;
    character: Enum.ResidentCharacter;
}

export interface IResidentDevice {
    deviceToken: string;
    deviceType: 'android' | 'ios';
}
