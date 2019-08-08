import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';

export type IFlow1MaybePrivacyName_String = string;
export type IFlow1MaybePrivacyPhone_String = string;
export type IFlow1MaybePrivacyEmail_String = string;
export type IFlow1MaybePrivacyImage_ParseFile = Parse.File;
export interface IFlow1MaybePrivacyIDCard_Object {
    name: string;
    birthdate: string;
    idnumber: string;
    images: Parse.File[];
}

export interface IFlow1Privacies {
    name?: IFlow1MaybePrivacyName_String;
    phone?: IFlow1MaybePrivacyPhone_String;
    email?: IFlow1MaybePrivacyEmail_String;
    image?: IFlow1MaybePrivacyImage_ParseFile;
    idcard?: IFlow1MaybePrivacyIDCard_Object;
}
@registerSubclass() export class Flow1Privacies extends ParseObject<IFlow1Privacies> {}
