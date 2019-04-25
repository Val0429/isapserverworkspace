import { RoleList } from 'core/cgi-package';

export interface IBaseIndexU {
    objectId: string;
    password?: string;
    roles?: RoleList[];
}

export interface IBaseLogin {
    account: string;
    password: string;
}

export interface IBaseLogout {
    sessionId: string;
}

export interface IBasePasswordU {
    objectId?: string;
    previous: string;
    current: string;
}
