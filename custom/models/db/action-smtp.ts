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
    triggerMax: number;

    /**
     * 觸發人數
     */
    triggerMin: number;
}

@registerSubclass()
export class ActionSmtp extends ParseObject<IActionSmtp> {}
