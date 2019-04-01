import { RoleList } from 'core/cgi-package';

export interface IBaseIndexR {
    userId: string;
    account: string;
    roles: string[];
}

export interface IBaseLogin {
    sessionId: string;
    userId: string;
    roles: string[];
}

export interface IUserIndexC {
    userId: string;
}

export interface IUserIndexR extends IBaseIndexR {
    name: string;
}

export interface IUserLogin extends IBaseLogin {
    name: string;
}
