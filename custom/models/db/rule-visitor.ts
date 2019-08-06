import { registerSubclass } from 'helpers/parse-server/parse-helper';
import { ParseObjectNotice, IRuleBase } from './_index';
import * as Enum from '../../enums';

/**
 * 條件
 */
export interface IRuleVisitorCondition {
    /**
     *
     */
    logical: Enum.EOperatorLogical;
}

/**
 * Rule and Action
 */
export interface IRuleVisitor extends IRuleBase {
    /**
     * 條件 When a VIP visits
     */
    conditionVip: IRuleVisitorCondition;

    /**
     * 條件 When a Blacklist visits
     */
    conditionBlacklist: IRuleVisitorCondition;
}

@registerSubclass()
export class RuleVisitor extends ParseObjectNotice<IRuleVisitor> {
    static notice$ = ParseObjectNotice._notice$.filter((x) => x.data.className === 'RuleVisitor');
}
