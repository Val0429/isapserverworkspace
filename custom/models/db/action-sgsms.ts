import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';

/**
 * 觸發簡訊動作
 */
export interface IActionSgsms {
    /**
     * 對象
     */
    userIds: string[];

    /**
     * 觸發人數
     */
    triggerCount: number;
}

@registerSubclass()
export class ActionSgsms extends ParseObject<IActionSgsms> {}
