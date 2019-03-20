import { RoleList } from 'core/cgi-package';

export interface IBaseIndexC {
    userId: string;
}

export interface IBaseIndexR {
    userId: string;
    account: string;
    roles: RoleList[];
}

export interface IBaseLogin {
    sessionId: string;
    userId: string;
    roles: string[];
}
