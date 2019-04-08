import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';

/**
 * 控制冷氣動作
 */
export interface IActionHanwhaAirCondition {
    /**
     * Do 號碼
     */
    doNumber: number;

    /**
     * Do 狀態
     */
    doStatus: 'On' | 'Off';

    /**
     * 觸發人數
     */
    triggerMax: number;

    /**
     * 觸發人數
     */
    triggerMin: number;
}

@registerSubclass()
export class ActionHanwhaAirCondition extends ParseObject<IActionHanwhaAirCondition> {}
