export interface ICampaignIndexC {
    name: string;
    type: string;
    year: number;
    budget: number;
    description: string;
    siteIds: string[];
    startDate: Date;
    endDate: Date;
}

export interface ICampaignIndexU {
    objectId: string;
    type?: string;
    year?: number;
    budget?: number;
    description?: string;
    siteIds?: string[];
    startDate?: Date;
    endDate?: Date;
}
