import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import * as Rx from 'rxjs';
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

export let LocationArea$: Rx.Subject<{ crud: 'c' | 'r' | 'u' | 'd'; mode: Enum.ECameraMode }> = new Rx.Subject();

@registerSubclass()
export class LocationArea extends ParseObject<ILocationArea> {}
