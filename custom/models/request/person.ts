/**
 * Staff Blacklist
 */
export interface IStaffBlacklistIndexC {
    imageBase64: string;
    organization?: string;
    name: string;
    nric: string;
    remark: string;
}

export interface IStaffBlacklistIndexU {
    objectId: string;
    organization?: string;
    name?: string;
    nric?: string;
    remark?: string;
}
