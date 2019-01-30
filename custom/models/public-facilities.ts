import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';

/// 公共設施 ////////////////////////////////////////
export interface IPublicFacilities {
    id: string;

    pic: Parse.File;
    name: string;
    description: string;

    peopleNumberLimit: number;
    redrawPoints: number;

    openTime: Date[];
    maintainTime: Date[];
}
@registerSubclass() export class PublicFacilities extends ParseObject<IPublicFacilities> {}
////////////////////////////////////////////////////
