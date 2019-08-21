import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';

import { Flow2Companies } from './companies';
import { Flow2Privacies, IFlow2MaybePrivacyName_String, IFlow2MaybePrivacyPhone_String, IFlow2MaybePrivacyEmail_String, IFlow2MaybePrivacyImage_ParseFile, IFlow2MaybePrivacyIDCard_Object } from './privacies';
import { Config } from 'core/config.gen';
import { IPrivacyFields } from 'workspace/config/custom/vms';
import { O } from 'helpers/utility';

export enum Flow2VisitorStatus {
    Pending = 0,
    Completed = 1
}

export interface IFlow2Visitors {
    name: IFlow2MaybePrivacyName_String;
    phone: IFlow2MaybePrivacyPhone_String;
    email?: IFlow2MaybePrivacyEmail_String;
    image?: IFlow2MaybePrivacyImage_ParseFile;
    idcard?: IFlow2MaybePrivacyIDCard_Object;

    status?: Flow2VisitorStatus;
    company?: Flow2Companies;

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
    privacy?: Flow2Privacies;
}
@registerSubclass() export class Flow2Visitors extends ParseObject<IFlow2Visitors> {
    constructor(data?: Partial<IFlow2Visitors>) {
        super();
        data && this.set(data);
    }

    public get attributesRemovePrivacy(): IFlow2Visitors {
        let attrs: IFlow2Visitors = {} as any;

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

    get<U extends keyof IFlow2Visitors>(key: U): IFlow2Visitors[U] | undefined {
        /// get privacy fields
        const privacyFields = Config.vms.privacyFields;
        if (privacyFields.indexOf(key as any) >= 0) {
            return O(O(super.attributes.privacy).attributes)[key as any];
        }
        return super.get(key as string);
    }
    getValue<U extends keyof IFlow2Visitors>(key: U): IFlow2Visitors[U] | undefined {
        return this.get(key);
    }

    set<U extends keyof IFlow2Visitors>(key: U, value: IFlow2Visitors[U], options?: Parse.Object.SetOptions): boolean;
    set<U extends keyof IFlow2Visitors>(attrs: Partial<IFlow2Visitors>, options?: Parse.Object.SetOptions): boolean;
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
                let privacy = this.get("privacy") || (this.set("privacy", new Flow2Privacies()), this.get("privacy"));
                privacy.set(key, value);
            }
        });
        return super.set(attrs, options);
    }
}
