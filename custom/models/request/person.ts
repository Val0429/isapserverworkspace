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

/**
 * Staff
 */
export interface IStaffIndexC {
    imageBase64?: string;
    floorIds: string[];
    companyId?: string;
    doorIds: string[];
    isUseSuntecReward?: boolean;
    name: string;
    email: string;
    nric?: string;
    position?: string;
    phone?: string;
    remark?: string;
    startDate: Date;
    endDate?: Date;
}

/**
 * Visitor Blacklist
 */
export interface IVisitorBlacklistIndexC {
    imageBase64?: string;
    organization?: string;
    name: string;
    nric?: string;
    remark: string;
}

export interface IVisitorBlacklistIndexD {
    objectId: string;
}

/**
 * Visitor
 */
export interface IVisitorIndexC {
    imageBase64?: string;
    floorIds: string[];
    companyId?: string;
    organization?: string;
    name: string;
    email: string;
    nric?: string;
    phone?: string;
    remark?: string;
    startDate: Date;
    endDate?: Date;
}

export interface IVisitorIndexD {
    objectId: string;
}
