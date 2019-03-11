import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import { Community, CharacterResident, PublicFacility } from './';

export interface IDateRange {
    startDate: Date;
    endDate: Date;
}

/**
 * 公共設施預約
 */
export interface IPublicFacilityReservation {
    /**
     * 創造人
     */
    creator: Parse.User;

    /**
     * 社區
     */
    community: Community;

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
    reservationDates: IDateRange;

    /**
     * 刪除
     */
    isDeleted: boolean;
}

@registerSubclass()
export class PublicFacilityReservation extends ParseObject<IPublicFacilityReservation> {}
