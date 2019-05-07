import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import { IBase, LocationFloor, IRule } from './_index';

/**
 * 區域
 */
export interface ILocationArea extends IBase {
    /**
     * 樓層
     */
    floor: LocationFloor;

    /**
     * 名稱
     */
    name: string;

    /**
     * data window X
     */
    dataWindowX: number;

    /**
     * data window Y
     */
    dataWindowY: number;

    /**
     * 動作
     */
    action: IRule;
}

@registerSubclass()
export class LocationArea extends ParseObject<ILocationArea> {}
