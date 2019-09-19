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
export type IWebIndexC = IWebIndexC_Administrator | IWebIndexC_TenantAdministrator | IWebIndexC_VMS;

export interface IWebIndexC_Base extends ILogin_User {
    name: string;
    email: string;
    phone?: string;
    position?: string;
    remark?: string;
}

export interface IWebIndexC_Administrator extends IWebIndexC_Base {
    role: RoleList.Administrator;
}

export interface IWebIndexC_TenantAdministrator extends IWebIndexC_Base {
    role: RoleList.TenantAdministrator;
    companyId: string;
    floorIds: string[];
}

export interface IWebIndexC_VMS extends IWebIndexC_Base {
    role: RoleList.VMS;
}

export interface IWebIndexU {
    objectId: string;
    name?: string;
    email?: string;
    phone?: string;
    position?: string;
    remark?: string;
    floorIds?: string[];
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
