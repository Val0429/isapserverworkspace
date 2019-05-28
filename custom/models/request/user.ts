import { RoleList } from 'core/cgi-package';
import * as Enum from '../../enums';

export interface IBaseLogin {
    account: string;
    password: string;
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

export interface IUserIndexC extends IBaseLogin {
    role: RoleList.Admin | RoleList.User;
    name: string;
    employeeId: string;
    email: string;
    phone?: string;
    locationIds: string[];
    groupIds: string[];
}

export interface IUserIndexU {
    objectId: string;
    role?: RoleList.Admin | RoleList.User;
    name?: string;
    email?: string;
    phone?: string;
    locationIds?: string[];
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
