import { registerSubclass } from 'helpers/parse-server/parse-helper';
import { ParseObjectNotice, IRuleBase, IThreshold } from './_index';
import * as Enum from '../../enums';

/**
 * 條件
 */
export interface IRuleHumanDetectionCondition {
    /**
     *
     */
    relational: Enum.EOperatorRelational.gt;

    /**
     *
     */
    threshold: Enum.EThreshold;

    /**
     *
     */
    logical: Enum.EOperatorLogical.or;
}

/**
 * Rule and Action
 */
export interface IRuleHumanDetection extends IRuleBase {
    /**
     * Threshold
     */
    threshold: IThreshold;

    /**
     * 條件   Current average occupancy per store
     */
    conditions: IRuleHumanDetectionCondition[];
}

@registerSubclass()
export class RuleHumanDetection extends ParseObjectNotice<IRuleHumanDetection> {
    static notice$ = ParseObjectNotice._notice$.filter((x) => x.data.className === 'RuleHumanDetection');
}
