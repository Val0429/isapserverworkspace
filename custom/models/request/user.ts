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

export interface ICommitteeIndexC extends IUser {
    roles: (RoleList.Chairman | RoleList.DeputyChairman | RoleList.DirectorGeneral | RoleList.FinanceCommittee | RoleList.Guard)[];
}

export interface ICommitteeIndexU {
    userId: string;
    passwordPrevious?: string;
    passwordCurrent?: string;
    adjustReason: string;
}

export interface ICommitteeIndexD {
    userIds: string[];
}

export interface IResidentIndexC {
    address: string;
    pointTotal: number;
    character: Enum.ResidentCharacter;
}
