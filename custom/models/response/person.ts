import { IObject } from './_index';

/**
 * Staff Blacklist
 */
export interface IStaffBlacklistIndexR {
    objectId: string;
    imageBase64: string;
    company: IObject;
    organization: string;
    name: string;
    nric: string;
    remark: string;
}

/**
 * Staff
 */
export interface IStaffIndexR {
    objectId: string;
    imageBase64: string;
    company: IObject;
    floors: IObject[];
    card: number;
    isUseSuntecReward: boolean;
    unitNumber: string;
    name: string;
    email: string;
    nric: string;
    position: string;
    phone: string;
    remark: string;
    startDate: Date;
    endDate: Date;
}

/**
 * Visitor Blacklist
 */
export interface IVisitorBlacklistIndexC {
    objectId: string;
    personId: string;
}

export interface IVisitorBlacklistIndexR {
    objectId: string;
    imageBase64: string;
    company: IObject;
    organization: string;
    name: string;
    nric: string;
    remark: string;
}

/**
 * Visitor
 */
export interface IVisitorIndexC {
    objectId: string;
    card: number;
}

export interface IVisitorIndexR {
    objectId: string;
    imageBase64: string;
    company: IObject;
    floors: IObject[];
    card: number;
    unitNumber: string;
    organization: string;
    name: string;
    email: string;
    nric: string;
    phone: string;
    remark: string;
    startDate: Date;
    endDate: Date;
}
