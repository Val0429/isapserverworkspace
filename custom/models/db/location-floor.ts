import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
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
}

@registerSubclass()
export class LocationFloor extends ParseObject<ILocationFloor> {}
