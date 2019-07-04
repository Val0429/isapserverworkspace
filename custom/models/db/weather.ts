import { registerSubclass } from 'helpers/parse-server/parse-helper';
import { ParseObjectNotice, LocationSite } from './_index';

/**
 * 天氣記錄
 */
export interface IWeather {
    /**
     * 地區
     */
    site: LocationSite;

    /**
     * 時間
     */
    date: Date;

    /**
     * 圖示
     */
    icon: string;

    /**
     * 最小溫度 (℃)
     */
    temperatureMin: number;

    /**
     * 最大溫度 (℃)
     */
    temperatureMax: number;
}

@registerSubclass()
export class Weather extends ParseObjectNotice<IWeather> {
    static notice$ = ParseObjectNotice._notice$.filter((x) => x.data.className === 'Weather');
}
