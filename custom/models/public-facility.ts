import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import { Community, IDateRange } from './';

export interface IDayRange extends IDateRange {
    startDay: string;
    endDay: string;
}

/**
 * 公共設施
 */
export interface IPublicFacility {
    /**
     * 創造人
     */
    creator: Parse.User;

    /**
     * 社區
     */
    community: Community;

    /**
     * 名稱
     */
    name: string;

    /**
     * 簡介
     */
    description: string;

    /**
     * 人數限制
     */
    limit: number;

    /**
     * 開放時間
     */
    openDates: IDayRange[];

    /**
     * 維護時間
     */
    maintenanceDates: IDayRange[];

    /**
     * 設施照片
     */
    facilitySrc: string;

    /**
     * 點數花費
     */
    pointCost: number;

    /**
     * 刪除
     */
    isDeleted: boolean;
}

@registerSubclass()
export class PublicFacility extends ParseObject<IPublicFacility> {}
