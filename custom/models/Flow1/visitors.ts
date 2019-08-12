import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';

import { Flow1Companies } from './companies';
import { Flow1Privacies, IFlow1MaybePrivacyName_String, IFlow1MaybePrivacyPhone_String, IFlow1MaybePrivacyEmail_String, IFlow1MaybePrivacyImage_ParseFile, IFlow1MaybePrivacyIDCard_Object } from './privacies';
import { Config } from 'core/config.gen';
import { IPrivacyFields } from 'workspace/config/custom/vms';
import { O } from 'helpers/utility';

export enum Flow1VisitorStatus {
    Pending = 0,
    Completed = 1
}

export interface IFlow1Visitors {
    name: IFlow1MaybePrivacyName_String;
    phone: IFlow1MaybePrivacyPhone_String;
    email: IFlow1MaybePrivacyEmail_String;
    image?: IFlow1MaybePrivacyImage_ParseFile;
    idcard?: IFlow1MaybePrivacyIDCard_Object;

    status?: Flow1VisitorStatus;
    company?: Flow1Companies;

    /**
     * RaffleLink info
     */
    contractorCompanyName?: string;
    unitNumber?: string;
    vehicle?: string;
    occupation?: string;
    shift?: string;

    /**
     * It's privacy. Don't input this field manually.
     */
    privacy?: Flow1Privacies;
}
@registerSubclass() export class Flow1Visitors extends ParseObject<IFlow1Visitors> {
    constructor(data?: Partial<IFlow1Visitors>) {
        super();
        data && this.set(data);
    }

    public get attributesRemovePrivacy(): IFlow1Visitors {
        let attrs: IFlow1Visitors = {} as any;

        let attributes = this.attributes;
        if (this.id) attrs["objectId"] = this.id;

        /// add privacy fields
        const privacyFields = Config.vms.privacyFields;
        for (let privacyField of privacyFields) {
            let value = this.get(privacyField);
            if (value !== undefined) attrs[privacyField] = value;
        }
        /// add other fields
        Object.keys(attributes).forEach( (key) => {
            if (attrs[key] !== undefined) return;
            if (key === 'privacy') return;
            let value = attributes[key];
            attrs[key] = value;
        });

        return attrs;
    }

    get<U extends keyof IFlow1Visitors>(key: U): IFlow1Visitors[U] | undefined {
        /// get privacy fields
        const privacyFields = Config.vms.privacyFields;
        if (privacyFields.indexOf(key as any) >= 0) {
            return O(O(super.attributes.privacy).attributes)[key as any];
        }
        return super.get(key as string);
    }
    getValue<U extends keyof IFlow1Visitors>(key: U): IFlow1Visitors[U] | undefined {
        return this.get(key);
    }

    set<U extends keyof IFlow1Visitors>(key: U, value: IFlow1Visitors[U], options?: Parse.Object.SetOptions): boolean;
    set<U extends keyof IFlow1Visitors>(attrs: Partial<IFlow1Visitors>, options?: Parse.Object.SetOptions): boolean;
    set(arg1: any, arg2?: any, arg3?: any): boolean {
        let attrs = typeof(arg1) === "object" ? arg1 : { [arg1]: arg2 };
        let options = typeof(arg1) === "object" ? arg2 : arg3;
        /// set privacy fields
        const privacyFields = Config.vms.privacyFields;
        Object.keys(attrs).forEach( (key) => {
            if (privacyFields.indexOf(key as any) >= 0) {
                let value = attrs[key];
                delete attrs[key];
                
                /// set into privacy
                let privacy = this.get("privacy") || (this.set("privacy", new Flow1Privacies()), this.get("privacy"));
                privacy.set(key, value);
            }
        });
        return super.set(attrs, options);
    }
}
