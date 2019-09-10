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
