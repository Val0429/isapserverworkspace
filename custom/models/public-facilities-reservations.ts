import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import { PublicFacilities } from './public-facilities';

/// 公共設施預約 ////////////////////////////////////
export interface IPublicFacilitiesReservations {
    facility: PublicFacilities;

    startDate: Date;
    endDate: Date;

    residant: Parse.User;
    reservePeople: number;
}
@registerSubclass() export class PublicFacilitiesReservations extends ParseObject<IPublicFacilitiesReservations> {}
////////////////////////////////////////////////////
