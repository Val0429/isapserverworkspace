import { IObject } from './_index';

export interface IBaseIndexR {
    objectId: string;
    account: string;
    roles: string[];
}

export interface IBaseLogin {
    sessionId: string;
    objectId: string;
    roles: string[];
}

export interface IUserIndexC {
    objectId: string;
}

export interface IUserIndexR {
    objectId: string;
    account: string;
    role: string;
    name: string;
    employeeId: string;
    email: string;
    phone: string;
    webLestUseDate: Date;
    appLastUseDate: Date;
    locations: IObject[];
    groups: IObject[];
    isAppBinding: boolean;
}

export interface IUserAll {
    objectId: string;
    name: string;
}

export interface IUserLogin extends IBaseLogin {
    account: string;
    name: string;
    employeeId: string;
    email: string;
    phone: string;
    webLestUseDate: Date;
    appLastUseDate: Date;
    locations: IObject[];
    groups: IObject[];
    isAppBinding: boolean;
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
