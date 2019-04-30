import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import * as Enum from '../../enums';

/**
 * 觸發認證狀態動作
 */
export interface IActionIdentification {
    /**
     * 類別
     */
    type: Enum.EIdentificationType;

    /**
     * 群組
     */
    names: string[];
}

@registerSubclass()
export class ActionIdentification extends ParseObject<IActionIdentification> {}
