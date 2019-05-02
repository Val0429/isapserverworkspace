import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import * as Rx from 'rxjs';
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

export let RuleNameList$: Rx.Subject<{}> = new Rx.Subject();

@registerSubclass()
export class RuleNameList extends ParseObject<IRuleNameList> {}
