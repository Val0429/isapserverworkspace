import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import * as Rx from 'rxjs';
import { IBase } from './_index';

/**
 * 樓層
 */
export interface ILocationFloor extends IBase {
    /**
     * 名稱
     */
    name: string;

    /**
     * 樓層號碼
     */
    floorNo: number;

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
     * data window X
     */
    dataWindowX: number;

    /**
     * data window Y
     */
    dataWindowY: number;

    /**
     * data window X
     */
    dataWindowPcX: number;

    /**
     * data window Y
     */
    dataWindowPcY: number;
}

export let LocationFloor$: Rx.Subject<{ crud: 'c' | 'r' | 'u' | 'd' }> = new Rx.Subject();

@registerSubclass()
export class LocationFloor extends ParseObject<ILocationFloor> {}
