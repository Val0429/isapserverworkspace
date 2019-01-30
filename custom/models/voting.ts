import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';

enum EStatus {
    OnGoing,
    Finished
}

/// 投票 ////////////////////////////////////////////
export interface IVoting {
    id: string;

    startDate: Date;
    dueDate: Date;

    title: string;
    status: EStatus;
}
@registerSubclass() export class Voting extends ParseObject<IVoting> {}
////////////////////////////////////////////////////
