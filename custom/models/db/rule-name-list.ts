import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import * as Enum from '../../enums';

/**
 * 觸發名單動作
 */
export interface IRuleNameList {
    /**
     * 類別
     */
    type: Enum.EIdentificationType;

    /**
     * 名單
     */
    name: string;
}

@registerSubclass()
export class RuleNameList extends ParseObject<IRuleNameList> {}
