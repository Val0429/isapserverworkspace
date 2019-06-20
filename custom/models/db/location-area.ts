import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import * as Rx from 'rxjs';
import { LocationSite } from './_index';

/**
 * 地區
 */
export interface ILocationArea {
    /**
     * 地區
     */
    site: LocationSite;

    /**
     * 名稱
     */
    name: string;

    /**
     * 圖片
     */
    imageSrc: string;

    /**
     * 地圖
     */
    mapSrc: string;
}

export let LocationArea$: Rx.Subject<{ crud: 'c' | 'r' | 'u' | 'd' }> = new Rx.Subject();

@registerSubclass()
export class LocationArea extends ParseObject<ILocationArea> {}
