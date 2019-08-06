import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';

import { Flow1Companies } from './companies';

export enum Flow1VisitorStatus {
    Pending = 0,
    Completed = 1
}

export interface IFlow1VisitorsIDCard {
    name: string;
    birthdate: string;
    idnumber: string;
    images: Parse.File[];
}

export interface IFlow1Visitors {
    name: string;
    phone: string;
    email: string;
    image?: Parse.File;
    idcard?: IFlow1VisitorsIDCard;
    status?: Flow1VisitorStatus;
    company?: Flow1Companies;

    touchDate?: Date;
}
@registerSubclass() export class Flow1Visitors extends ParseObject<IFlow1Visitors> {}
