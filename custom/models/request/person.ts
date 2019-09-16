/**
 * Staff Blacklist
 */
export interface IStaffBlacklistIndexC {
    imageBase64?: string;
    organization?: string;
    name: string;
    nric?: string;
    remark: string;
}

// export interface IStaffBlacklistIndexU {
//     objectId: string;
//     organization?: string;
//     name?: string;
//     nric?: string;
//     remark?: string;
// }

/**
 * Staff
 */
export interface IStaffIndexC {
    imageBase64?: string;
    isUseSuntecReward?: boolean;
    permissionFloorIds: string[];
    permissionCompanyId: string;
    name: string;
    email: string;
    nric?: string;
    position?: string;
    phone?: string;
    remark?: string;
    startDate: Date;
    endDate?: Date;
}

export interface IStaffIndexU {
    objectId: string;
    imageBase64?: string;
    isUseSuntecReward?: boolean;
    permissionFloorIds?: string[];
    permissionCompanyId?: string;
    name?: string;
    email?: string;
    nric?: string;
    position?: string;
    phone?: string;
    remark?: string;
    startDate?: Date;
    endDate?: Date;
}
