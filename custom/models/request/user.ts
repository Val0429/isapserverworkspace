import { RoleList } from 'core/cgi-package';
import * as Enum from '../../enums';

export interface ILogin_User {
    username: string;
    password: string;
}

export interface ILogin_SessionId {
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

export interface IUserIndexC extends ILogin_User {
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

export interface IEnableStep1 {
    verification: string;
    password: string;
}

export interface IResend {
    objectId: string;
}
