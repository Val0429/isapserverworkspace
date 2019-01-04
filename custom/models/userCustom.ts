import { registerSubclass, ParseObject } from './../../../helpers/parse-server/parse-helper';

export interface IUserCustom {
    realname: string;
    permission?: number;
    imei?: string;
    creator?: Parse.User;
    isDisable?: boolean;
}

@registerSubclass()
export class UserCustom extends ParseObject<IUserCustom> {}
