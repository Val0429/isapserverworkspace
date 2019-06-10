import { RoleList } from 'core/cgi-package';
import * as Enum from '../../enums';

export interface IBaseLogin_User {
    account: string;
    password: string;
}

export interface IBaseLogin_SessionId {
    sessionId: string;
}

export interface IBaseLogout {
    sessionId: string;
}

export interface IBasePasswordU {
    objectId?: string;
    previous: string;
    current: string;
}

export interface IBaseRoleU {
    objectId?: string;
    roles: RoleList[];
}

export interface IUserIndexC extends IBaseLogin_User {
    role: RoleList.Admin | RoleList.User;
    name: string;
    employeeId: string;
    email: string;
    phone?: string;
    siteIds: string[];
    groupIds: string[];
}

export interface IUserIndexU {
    objectId: string;
    role?: RoleList.Admin | RoleList.User;
    name?: string;
    email?: string;
    phone?: string;
    siteIds?: string[];
    groupIds?: string[];
}

export interface IGroupIndexC {
    name: string;
    description: string;
    siteIds: string[];
}

export interface IGroupIndexU {
    objectId: string;
    description?: string;
    siteIds?: string[];
}

export interface IForgetStep1 {
    account: string;
    email: string;
}

export interface IForgetStep2 {
    account: string;
    verification: string;
}

export interface IForgetStep3 extends IForgetStep2 {
    password: string;
}
