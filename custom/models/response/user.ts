import { RoleList } from 'core/cgi-package';

export interface IBaseIndexC {
    objectId: string;
}

export interface IBaseIndexR {
    objectId: string;
    account: string;
    roles: RoleList[];
}

export interface IBaseLogin {
    sessionId: string;
    objectId: string;
    roles: string[];
    serverTime: Date;
}

export interface ICommitteeIndexC {
    objectId: string;
}

export interface ICommitteeIndexR extends IBaseIndexR {
    adjustReason: string;
}
