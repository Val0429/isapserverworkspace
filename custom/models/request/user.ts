import { RoleList } from 'core/cgi-package';

export interface IBaseIndexU {
    userId: string;
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
    userId?: string;
    previous: string;
    current: string;
}

export interface IUserIndexC extends IBaseLogin {
    role: RoleList.Admin | RoleList.User;
    name: string;
    email: string;
    phone: string;
}

export interface IUserIndexU {
    userId?: string;
    password?: string;
    role?: RoleList.Admin | RoleList.User;
    name?: string;
    email?: string;
    phone?: string;
}

export interface IUserIndexD {
    userIds: string | string[];
}
