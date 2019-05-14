import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import { IBase, LocationFloor, IAction } from './_index';
import * as Enum from '../../enums';

/**
 * 區域
 */
export interface ILocationArea extends IBase {
    /**
     * 樓層
     */
    floor: LocationFloor;

    /**
     *
     */
    mode: Enum.ECameraMode;

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
    action: IAction;
}

@registerSubclass()
export class LocationArea extends ParseObject<ILocationArea> {}
