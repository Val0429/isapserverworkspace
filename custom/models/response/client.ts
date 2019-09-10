import { IObject } from './_index';

/**
 * FRS Index
 */
export interface IFRSIndexR {
    objectId: string;
    floor: IObject;
    name: string;
    protocol: 'http' | 'https';
    ip: string;
    port: number;
    account: string;
    password: string;
}

/**
 * HikVision Index
 */
export interface IHikVisionIndexR {
    objectId: string;
    floor: IObject;
    name: string;
    protocol: 'http' | 'https';
    ip: string;
    port: number;
    account: string;
    password: string;
}

/**
 * VMS Index
 */
export interface IVMSIndexR {
    objectId: string;
    name: string;
    protocol: 'http' | 'https';
    ip: string;
    port: number;
    account: string;
    password: string;
}
