import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';

export type IFlow2MaybePrivacyName_String = string;
export type IFlow2MaybePrivacyPhone_String = string;
export type IFlow2MaybePrivacyEmail_String = string;
export type IFlow2MaybePrivacyImage_ParseFile = Parse.File;
export interface IFlow2MaybePrivacyIDCard_Object {
    name: string;
    birthdate: string;
    idnumber: string;
    images: Parse.File[];
}

export interface IFlow2Privacies {
    name?: IFlow2MaybePrivacyName_String;
    phone?: IFlow2MaybePrivacyPhone_String;
    email?: IFlow2MaybePrivacyEmail_String;
    image?: IFlow2MaybePrivacyImage_ParseFile;
    idcard?: IFlow2MaybePrivacyIDCard_Object;
}
@registerSubclass() export class Flow2Privacies extends ParseObject<IFlow2Privacies> {}
