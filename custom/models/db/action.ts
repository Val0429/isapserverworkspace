import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import { IActionSgsms, IActionSmtp } from './_index';

/**
 * 觸發動作
 */
export interface IAction {
    /**
     * 簡訊
     */
    sgsms?: IActionSgsms[];

    /**
     * 電子郵件
     */
    smtp?: IActionSmtp[];
}

@registerSubclass()
export class Action extends ParseObject<IAction> {}
