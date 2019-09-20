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
    position: string;
    remark: string;
    company: IObject;
    floors: IObject[];
    webLestUseDate: Date;
}

/**
 * Web Login
 */
export interface IWebLoginUserTree {
    [key: string]: {
        building: IObject;
        floors: IObject[];
    };
}

export interface IWebLoginUser {
    objectId: string;
    roles: IObject[];
    username: string;
    name: string;
    email: string;
    phone: string;
    position: string;
    remark: string;
    webLestUseDate: Date;
    company: IObject;
    floors: IObject[];
    buildings: IObject[];
    tree: IWebLoginUserTree;
}

export interface IWebLogin {
    sessionId: string;
    user: IWebLoginUser;
}

/**
 * Forget
 */
export interface IForgetStep3 extends IWebLogin {}
