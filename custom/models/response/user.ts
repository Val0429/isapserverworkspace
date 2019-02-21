import { RoleList } from 'core/cgi-package';

export interface IIndexC {
    objectId: string;
}

export interface IIndexR {
    objectId: string;
    account: string;
    roles: RoleList[];
}

export interface ILogin {
    sessionId: string;
    objectId: string;
    roles: string[];
    serverTime: Date;
}
