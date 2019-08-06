import { IRuleBaseNotifyMethod, IThreshold, IRuleHumanDetectionCondition, IRulePeopleCountingCondition, IRuleRepeatVisitorCondition, IRuleVisitorCondition } from '../db/_index';
import { IDate } from '../base/_index';

export interface IRuleBaseNotifyObject {
    isSiteManager: boolean;
    isSitePermission: boolean;
    userIds: string[];
    userGroupIds: string[];
}

export interface IRuleBaseC {
    name: string;
    isEnable: boolean;
    runTime: IDate.IRange;
    siteIds: string[];
    areaIds: string[];
    deviceGroupIds: string[];
    deviceIds: string[];
    notifyMethod: IRuleBaseNotifyMethod;
    notifyObject: IRuleBaseNotifyObject;
    notifyLockMinute: number;
}

export interface IRuleBaseU {
    objectId: string;
    name?: string;
    isEnable?: boolean;
    runTime?: IDate.IRange;
    siteIds?: string[];
    areaIds?: string[];
    deviceGroupIds?: string[];
    deviceIds?: string[];
    notifyMethod?: IRuleBaseNotifyMethod;
    notifyObject?: IRuleBaseNotifyObject;
    notifyLockMinute?: number;
}

export interface IHumanDetectionC extends IRuleBaseC {
    threshold: IThreshold;
    conditions: IRuleHumanDetectionCondition[];
}

export interface IHumanDetectionU extends IRuleBaseU {
    threshold?: IThreshold;
    conditions?: IRuleHumanDetectionCondition[];
}

export interface IPeopleCountingC extends IRuleBaseC {
    conditionTotal: IRulePeopleCountingCondition;
    conditionBalance: IRulePeopleCountingCondition;
}

export interface IPeopleCountingU extends IRuleBaseU {
    conditionTotal?: IRulePeopleCountingCondition;
    conditionBalance?: IRulePeopleCountingCondition;
}

export interface IRepeatVisitorC extends IRuleBaseC {
    conditions: IRuleRepeatVisitorCondition[];
}

export interface IRepeatVisitorU extends IRuleBaseU {
    conditions?: IRuleRepeatVisitorCondition[];
}

export interface IVisitorC extends IRuleBaseC {
    conditionVip: IRuleVisitorCondition;
    conditionBlacklist: IRuleVisitorCondition;
}

export interface IVisitorU extends IRuleBaseU {
    conditionVip?: IRuleVisitorCondition;
    conditionBlacklist?: IRuleVisitorCondition;
}
