import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import { IActionHanwhaAirCondition } from './_index';

/**
 * 觸發動作
 */
export interface IAction {
    /**
     * 控制冷氣動作清單
     */
    hanwhaAirConditions?: IActionHanwhaAirCondition[];
}

@registerSubclass()
export class Action extends ParseObject<IAction> {}
