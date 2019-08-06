import { registerSubclass } from 'helpers/parse-server/parse-helper';
import { ParseObjectNotice, IRuleBase } from './_index';
import * as Enum from '../../enums';

/**
 * 條件
 */
export interface IRulePeopleCountingCondition {
    /**
     *
     */
    relational: Enum.EOperatorRelational;

    /**
     *
     */
    value: number;

    /**
     *
     */
    logical: Enum.EOperatorLogical;
}

/**
 * Rule and Action
 */
export interface IRulePeopleCounting extends IRuleBase {
    /**
     * 條件 Today accumulated traffic-in per store
     */
    conditionTotal: IRulePeopleCountingCondition;

    /**
     * 條件 Current difference between traffic-in and traffic-out per store
     */
    conditionBalance: IRulePeopleCountingCondition;
}

@registerSubclass()
export class RulePeopleCounting extends ParseObjectNotice<IRulePeopleCounting> {
    static notice$ = ParseObjectNotice._notice$.filter((x) => x.data.className === 'RulePeopleCounting');
}
