import { IRuleBaseNotifyMethod, IThreshold, IRuleHumanDetectionCondition, IRulePeopleCountingCondition, IRuleRepeatVisitorCondition, IRuleVisitorCondition } from '../db/_index';
import { IObject } from './_index';
import { IDate } from '../base/_index';

export interface IRuleBaseNotifyObject {
    isSiteManager: boolean;
    isSitePermission: boolean;
    userIds: IObject[];
    userGroupIds: IObject[];
}

export interface IRuleBaseR {
    name: string;
    isEnable: boolean;
    runTime: IDate.IRange;
    siteIds: IObject[];
    areaIds: IObject[];
    deviceGroupIds: IObject[];
    deviceIds: IObject[];
    notifyMethod: IRuleBaseNotifyMethod;
    notifyObject: IRuleBaseNotifyObject;
    notifyLockMinute: number;
}

export interface IHumanDetectionR extends IRuleBaseR {
    threshold: IThreshold;
    conditions: IRuleHumanDetectionCondition[];
}

export interface IPeopleCountingR extends IRuleBaseR {
    conditionTotal: IRulePeopleCountingCondition;
    conditionBalance: IRulePeopleCountingCondition;
}

export interface IRepeatVisitorR extends IRuleBaseR {
    conditions: IRuleRepeatVisitorCondition[];
}

export interface IVisitorR extends IRuleBaseR {
    conditionVip: IRuleVisitorCondition;
    conditionBlacklist: IRuleVisitorCondition;
}
