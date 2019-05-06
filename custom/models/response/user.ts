import { RoleList } from 'core/cgi-package';

export interface IBaseIndexR {
    objectId: string;
    account: string;
    roles: string[];
}

export interface IBaseLogin {
    sessionId: string;
    objectId: string;
    roles: string[];
}

export interface IUserIndexC {
    objectId: string;
}

export interface IUserIndexR {
    objectId: string;
    account: string;
    role: string;
    name: string;
    email: string;
    phone: string;
}

export interface IUserAll {
    objectId: string;
    name: string;
}

export interface IUserLogin extends IBaseLogin {
    name: string;
}
