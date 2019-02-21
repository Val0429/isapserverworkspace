import { RoleList } from 'core/cgi-package';

export interface IIndexC {
    account: string;
    password: string;
    roles: RoleList[];
}

export interface IIndexD {
    objectId: string;
}

export interface ILogin {
    username: string;
    password: string;
}

export interface ILogout {
    sessionId: string;
}
