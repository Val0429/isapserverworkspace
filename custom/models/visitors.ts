import { registerSubclass, ParseObject } from './../../../helpers/parse-server/parse-helper';

import { Companies } from './companies';

export enum VisitorStatus {
    Pending = 0,
    Completed = 1
}

export interface IVisitorsIDCard {
    images: Parse.File[];
}

export interface IVisitors {
    name: string;
    phone: string;
    email: string;
    image?: Parse.File;
    idcard?: IVisitorsIDCard;
    status?: VisitorStatus;
    company?: Companies;
}
@registerSubclass() export class Visitors extends ParseObject<IVisitors> {}
