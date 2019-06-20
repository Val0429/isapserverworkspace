export interface ICampaignIndexC {
    name: string;
    type: string;
    budget: number;
    description: string;
    siteIds: string[];
    startDate: Date;
    endDate: Date;
}

export interface ICampaignIndexU {
    objectId: string;
    type?: string;
    budget?: number;
    description?: string;
    siteIds?: string[];
    startDate?: Date;
    endDate?: Date;
}
