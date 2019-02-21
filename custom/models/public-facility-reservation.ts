import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import { CharacterResident, PublicFacility } from './';

/**
 * 公共設施預約
 */
export interface IPublicFacilityReservation {
    /**
     * 創造人
     */
    creator: Parse.User;

    /**
     * 設施
     */
    facility: PublicFacility;

    /**
     * 預約人
     */
    resident: CharacterResident;

    /**
     * 預約人數
     */
    count: number;

    /**
     * 預約時段
     */
    reservationDates: Date[];
}

@registerSubclass()
export class PublicFacilityReservation extends ParseObject<IPublicFacilityReservation> {}
