import { IObject } from './_index';

export interface ICampaignIndexR {
    objectId: string;
    name: string;
    type: string;
    budget: number;
    description: string;
    sites: IObject[];
    startDate: Date;
    endDate: Date;
}
