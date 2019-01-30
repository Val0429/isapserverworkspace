import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';

enum EStatus {
    Replied,
    NotReplied
}

/// 聯絡管委會 //////////////////////////////////////
export interface IContactManagementCommittee {
    id: string;

    title: string;
    content: string;

    status: EStatus;
}
@registerSubclass() export class ContactManagementCommittee extends ParseObject<IContactManagementCommittee> {}
////////////////////////////////////////////////////
