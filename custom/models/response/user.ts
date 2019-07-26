import { IObject } from './_index';

export interface IBaseIndexR {
    objectId: string;
    username: string;
    roles: string[];
}

export interface IUserIndexC {
    objectId: string;
}

export interface IUserIndexR {
    objectId: string;
    username: string;
    role: string;
    name: string;
    employeeId: string;
    email: string;
    phone: string;
    webLestUseDate: Date;
    appLastUseDate: Date;
    sites: IObject[];
    groups: IObject[];
    isAppBinding: boolean;
}

export interface IUserAll {
    objectId: string;
    name: string;
}

export interface IUserLoginUser {
    objectId: string;
    roles: IObject[];
    username: string;
    name: string;
    employeeId: string;
    email: string;
    phone: string;
    webLestUseDate: Date;
    appLastUseDate: Date;
    sites: IObject[];
    groups: IObject[];
    isAppBinding: boolean;
    allowSites: IObject[];
}

export interface IUserLogin {
    sessionId: string;
    user: IUserLoginUser;
}

export interface IGroupIndexR {
    objectId: string;
    name: string;
    description: string;
    sites: IObject[];
    users: IObject[];
}

export interface IGroupAll {
    objectId: string;
    name: string;
}

export interface IForgetStep3 extends IUserLogin {}
