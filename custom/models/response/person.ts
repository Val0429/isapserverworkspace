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
