/**
 * Person Blacklist
 */
export interface IPersonBlacklistC {
    name: string;
    position?: string;
    phone?: string;
    email: string;
    remark?: string;
}

export interface IPersonBlacklistU {
    objectId: string;
    name?: string;
    position?: string;
    phone?: string;
    email?: string;
    remark?: string;
}
