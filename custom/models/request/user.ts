import { RoleList } from 'core/cgi-package';

interface IUser {
    account: string;
    password: string;
}

export interface IBaseIndexC extends IUser {
    roles: RoleList[];
}

export interface IBaseIndexD {
    objectId: string;
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
    objectId: string;
    passwordPrevious?: string;
    passwordCurrent?: string;
    adjustReason: string;
}

export interface ICommitteeIndexD {
    objectIds: string[];
}
