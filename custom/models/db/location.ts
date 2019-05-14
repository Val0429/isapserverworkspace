import { registerSubclass } from 'helpers/parse-server/parse-helper';
import * as Rx from 'rxjs';
import { Tree } from 'models/nodes';
import * as Enum from '../../enums';

/**
 * 地區
 */
export interface ILocation {
    /**
     * 名稱
     */
    name: string;

    /**
     * 類型
     */
    level: Enum.ELocationLevel;

    /**
     * 號碼
     */
    no: number;

    /**
     * 圖片
     */
    imageSrc: string;

    /**
     * 寬
     */
    imageWidth: number;

    /**
     * 高
     */
    imageHeight: number;

    /**
     * 經度
     */
    longitude: number;

    /**
     * 緯度
     */
    latitude: number;

    /**
     * X
     */
    x: number;

    /**
     * Y
     */
    y: number;

    /**
     * data window X
     */
    dataWindowX: number;

    /**
     * data window Y
     */
    dataWindowY: number;
}

export let Location$: Rx.Subject<{ crud: 'c' | 'r' | 'u' | 'd' }> = new Rx.Subject();

@registerSubclass({
    container: true,
})
export class Location extends Tree<ILocation> {
    groupBy: null;
}
