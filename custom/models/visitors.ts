import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';

enum EPurpose {
    Visiting
}

/// 訪客管理 ////////////////////////////////////////
export interface IVisitors {
    targetResidant: Parse.User;
    
    name: string;
    image: Parse.File;
    purpose: EPurpose;
    peopleCount: number;
    memo: string;
}
@registerSubclass() export class Visitors extends ParseObject<IVisitors> {}
////////////////////////////////////////////////////
