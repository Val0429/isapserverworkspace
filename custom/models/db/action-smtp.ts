import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';

/**
 * 觸發電子郵件動作
 */
export interface IActionSmtp {
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
export class ActionSmtp extends ParseObject<IActionSmtp> {}
