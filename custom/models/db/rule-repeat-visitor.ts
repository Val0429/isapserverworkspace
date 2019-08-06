import { registerSubclass } from 'helpers/parse-server/parse-helper';
import { ParseObjectNotice, IRuleBase } from './_index';
import * as Enum from '../../enums';

/**
 * 條件
 */
export interface IRuleRepeatVisitorCondition {
    /**
     *
     */
    relational: Enum.EOperatorRelational;

    /**
     *
     */
    times: number;

    /**
     *
     */
    days: number;

    /**
     *
     */
    logical: Enum.EOperatorLogical;
}

/**
 * Rule and Action
 */
export interface IRuleRepeatVisitor extends IRuleBase {
    /**
     * 條件 When a repeat visitor visits more than ${times} times in past ${days} days.
     */
    conditions: IRuleRepeatVisitorCondition[];
}

@registerSubclass()
export class RuleRepeatVisitor extends ParseObjectNotice<IRuleRepeatVisitor> {
    static notice$ = ParseObjectNotice._notice$.filter((x) => x.data.className === 'RuleRepeatVisitor');
}
