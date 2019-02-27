import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import { IDateRange } from './';

export interface IDayRange extends IDateRange {
    days: string[];
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
}

@registerSubclass()
export class PublicFacility extends ParseObject<IPublicFacility> {}
