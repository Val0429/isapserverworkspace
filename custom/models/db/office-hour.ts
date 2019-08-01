import { registerSubclass } from 'helpers/parse-server/parse-helper';
import { ParseObjectNotice, LocationSite } from './_index';
import { IDay } from '../base/_index';

/**
 * 營業時間
 */
export interface IOfficeHour {
    /**
     * 名稱
     */
    name: string;

    /**
     * 時段
     */
    dayRanges: IDay.IRange[];

    /**
     * Site
     */
    sites: LocationSite[];
}

@registerSubclass()
export class OfficeHour extends ParseObjectNotice<IOfficeHour> {
    static notice$ = ParseObjectNotice._notice$.filter((x) => x.data.className === 'OfficeHour');
}
