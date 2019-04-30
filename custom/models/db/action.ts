import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import { IActionIdentification } from './_index';

/**
 * 觸發動作
 */
export interface IAction {
    /**
     * 認證狀態
     */
    identification?: IActionIdentification[];
}

@registerSubclass()
export class Action extends ParseObject<IAction> {}
