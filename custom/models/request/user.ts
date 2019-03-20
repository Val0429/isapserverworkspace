import { RoleList } from 'core/cgi-package';

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
