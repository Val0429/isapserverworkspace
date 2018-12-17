import { registerSubclass, ParseObject } from './../../../helpers/parse-server/parse-helper';
import { IRegion } from './';

export interface IUserCustom {
    realname: string;
    permission?: number;
    imei?: string;
    regions?: IRegion[];
    creator?: Parse.User;
    isDisable?: boolean;
}

@registerSubclass()
export class UserCustom extends ParseObject<IUserCustom> {}
