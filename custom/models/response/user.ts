import { IObject } from './_index';

/**
 * Web Index
 */
export interface IWebIndexC {
    objectId: string;
}

export interface IWebIndexR {
    objectId: string;
    role: string;
    username: string;
    name: string;
    email: string;
    phone: string;
    remark: string;
    webLestUseDate: Date;
}

/**
 * Web Login
 */
export interface IWebLoginuser {
    objectId: string;
    roles: IObject[];
    username: string;
    name: string;
    email: string;
    phone: string;
    remark: string;
    webLestUseDate: Date;
}

export interface IWebLogin {
    sessionId: string;
    user: IWebLoginuser;
}

/**
 * Forget
 */
export interface IForgetStep3 extends IWebLogin {}
