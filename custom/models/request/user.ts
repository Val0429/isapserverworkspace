import { RoleList } from 'core/cgi-package';

/**
 * Login
 */
export interface ILogin_User {
    username: string;
    password: string;
}

export interface ILogin_SessionId {
    sessionId: string;
}

/**
 * Base Logout
 */
export interface IBaseLogout {
    sessionId: string;
}

/**
 * Base Password
 */
export interface IBasePasswordU {
    objectId?: string;
    previous: string;
    current: string;
}

/**
 * Base Role
 */
export interface IBaseRoleU {
    objectId?: string;
    roles: RoleList[];
}

/**
 * Web Index
 */
export interface IWebIndexC extends ILogin_User {
    role: RoleList.Administrator | RoleList.TenantAdministrator;
    name: string;
    email: string;
    phone?: string;
    remark?: string;
}

export interface IWebIndexU {
    objectId: string;
    name?: string;
    email?: string;
    phone?: string;
    remark?: string;
}

/**
 * Forget
 */
export interface IForgetStep1 {
    username: string;
    email: string;
}

export interface IForgetStep2 {
    username: string;
    verification: string;
}

export interface IForgetStep3 extends IForgetStep2 {
    password: string;
}
