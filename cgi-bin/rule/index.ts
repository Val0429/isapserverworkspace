import { IUser, Action, Restful, RoleList, Errors, Socket, IBase } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../custom/models';
import { Print } from '../../custom/helpers';
import * as Enum from '../../custom/enums';

let action = new Action({
    loginRequired: true,
});

export default action;

/**
 * Create Rule
 * @param rule
 * @param input
 */
export async function GetCreateBaseRuleObject<T extends Parse.Object>(collection: new () => T, input: IRequest.IRule.IRuleBaseC): Promise<T> {
    try {
        let rule: T = new collection();

        let devices: IDB.Device[] = await new Parse.Query(IDB.Device)
            .containedIn('objectId', input.deviceIds)
            .find()
            .fail((e) => {
                throw e;
            });
        let deviceGroups: IDB.DeviceGroup[] = await new Parse.Query(IDB.DeviceGroup)
            .containedIn('objectId', input.deviceGroupIds)
            .find()
            .fail((e) => {
                throw e;
            });
        let areas: IDB.LocationArea[] = await new Parse.Query(IDB.LocationArea)
            .containedIn('objectId', input.areaIds)
            .find()
            .fail((e) => {
                throw e;
            });
        let sites: IDB.LocationSite[] = await new Parse.Query(IDB.LocationSite)
            .containedIn('objectId', input.siteIds)
            .find()
            .fail((e) => {
                throw e;
            });

        let userGroups: IDB.UserGroup[] = await new Parse.Query(IDB.UserGroup)
            .containedIn('objectId', input.notifyObject.userGroupIds)
            .find()
            .fail((e) => {
                throw e;
            });

        let users: Parse.User[] = await new Parse.Query(Parse.User)
            .containedIn('objectId', input.notifyObject.userIds)
            .find()
            .fail((e) => {
                throw e;
            });

        let notifyObject: IDB.IRuleBaseNotifyObject = {
            isSiteManager: input.notifyObject.isSiteManager,
            isSitePermission: input.notifyObject.isSitePermission,
            users: users,
            userGroups: userGroups,
        };

        rule.set('name', input.name);
        rule.set('isEnable', input.isEnable);
        rule.set('runTime', input.runTime);
        rule.set('devices', devices);
        rule.set('deviceGroups', deviceGroups);
        rule.set('areas', areas);
        rule.set('sites', sites);
        rule.set('notifyMethod', input.notifyMethod);
        rule.set('notifyObject', notifyObject);
        rule.set('notifyLockMinute', input.notifyLockMinute);

        return rule;
    } catch (e) {
        throw e;
    }
}

/**
 * Create Rule
 * @param rule
 * @param input
 */
export async function GetUpdateBaseRuleObject<T extends Parse.Object>(collection: new () => T, input: IRequest.IRule.IRuleBaseU): Promise<T> {
    try {
        let rule: T = await new Parse.Query(collection)
            .equalTo('objectId', input.objectId)
            .first()
            .fail((e) => {
                throw e;
            });
        if (!rule) {
            throw Errors.throw(Errors.CustomBadRequest, ['rule not found']);
        }

        if (input.name) {
            rule.set('name', input.name);
        }
        if (input.isEnable || input.isEnable === false) {
            rule.set('isEnable', input.isEnable);
        }
        if (input.runTime) {
            rule.set('runTime', input.runTime);
        }
        if (input.deviceIds) {
            let devices: IDB.Device[] = await new Parse.Query(IDB.Device)
                .containedIn('objectId', input.deviceIds)
                .find()
                .fail((e) => {
                    throw e;
                });

            rule.set('devices', devices);
        } else if (input.deviceGroupIds) {
            let deviceGroups: IDB.DeviceGroup[] = await new Parse.Query(IDB.DeviceGroup)
                .containedIn('objectId', input.deviceGroupIds)
                .find()
                .fail((e) => {
                    throw e;
                });

            rule.set('deviceGroups', deviceGroups);
        } else if (input.areaIds) {
            let areas: IDB.LocationArea[] = await new Parse.Query(IDB.LocationArea)
                .containedIn('objectId', input.areaIds)
                .find()
                .fail((e) => {
                    throw e;
                });

            rule.set('areas', areas);
        } else if (input.siteIds) {
            let sites: IDB.LocationSite[] = await new Parse.Query(IDB.LocationSite)
                .containedIn('objectId', input.siteIds)
                .find()
                .fail((e) => {
                    throw e;
                });

            rule.set('sites', sites);
        }
        if (input.notifyMethod) {
            rule.set('notifyMethod', input.notifyMethod);
        }
        if (input.notifyObject) {
            let userGroups: IDB.UserGroup[] = await new Parse.Query(IDB.UserGroup)
                .containedIn('objectId', input.notifyObject.userGroupIds)
                .find()
                .fail((e) => {
                    throw e;
                });

            let users: Parse.User[] = await new Parse.Query(Parse.User)
                .containedIn('objectId', input.notifyObject.userIds)
                .find()
                .fail((e) => {
                    throw e;
                });

            let notifyObject: IDB.IRuleBaseNotifyObject = {
                isSiteManager: input.notifyObject.isSiteManager,
                isSitePermission: input.notifyObject.isSitePermission,
                users: users,
                userGroups: userGroups,
            };

            rule.set('notifyObject', notifyObject);
        }
        if (input.notifyLockMinute) {
            rule.set('notifyLockMinute', input.notifyLockMinute);
        }

        return rule;
    } catch (e) {
        throw e;
    }
}

/**
 * Delete
 * @param collection
 * @param objectId
 */
export async function Delete<T extends Parse.Object>(collection: new () => T, objectId: string): Promise<void> {
    try {
        let rule: T = await new Parse.Query(collection)
            .equalTo('objectId', objectId)
            .first()
            .fail((e) => {
                throw e;
            });
        if (!rule) {
            throw Errors.throw(Errors.CustomBadRequest, ['rule not found']);
        }

        await rule.destroy({ useMasterKey: true }).fail((e) => {
            throw e;
        });
    } catch (e) {
        throw e;
    }
}

/**
 * Unbinding
 * @param collection
 * @param data
 * @param parameter
 */
async function Unbinding<T extends Parse.Object>(collection: new () => T, data: Parse.Object, parameter1: string): Promise<void>;
async function Unbinding<T extends Parse.Object>(collection: new () => T, data: Parse.Object, parameter1: string, parameter2: string): Promise<void>;
async function Unbinding<T extends Parse.Object>(collection: new () => T, data: Parse.Object, parameter1: string, parameter2?: string): Promise<void> {
    try {
        let rules: T[] = await new Parse.Query(collection)
            .containedIn(`${parameter1}${parameter2 ? `.${parameter2}` : ''}`, [data])
            .find()
            .fail((e) => {
                throw e;
            });

        await Promise.all(
            rules.map(async (value, index, array) => {
                if (parameter2) {
                    let object = value.get(parameter1);
                    object[parameter2] = (object[parameter2] as Parse.Object[]).filter((value1, index1, array1) => {
                        return value1.id !== data.id;
                    });
                    value.set(parameter1, object);
                } else {
                    let areas: Parse.Object[] = (value.get(parameter1) as Parse.Object[]).filter((value1, index1, array1) => {
                        return value1.id !== data.id;
                    });
                    value.set(parameter1, areas);
                }

                await value.save(null, { useMasterKey: true }).fail((e) => {
                    throw e;
                });
            }),
        );
    } catch (e) {
        throw e;
    }
}

/**
 * Unbinding when site was delete
 */
IDB.LocationSite.notice$
    .filter((x) => x.crud === 'd')
    .subscribe({
        next: async (x) => {
            try {
                let tasks = [];

                tasks.push(Unbinding(IDB.RuleHumanDetection, x.data, 'sites'));
                tasks.push(Unbinding(IDB.RulePeopleCounting, x.data, 'sites'));
                tasks.push(Unbinding(IDB.RuleRepeatVisitor, x.data, 'sites'));
                tasks.push(Unbinding(IDB.RuleVisitor, x.data, 'sites'));

                await Promise.all(tasks);
            } catch (e) {
                Print.Log(e, new Error(), 'error');
            }
        },
    });

/**
 * Unbinding when area was delete
 */
IDB.LocationArea.notice$
    .filter((x) => x.crud === 'd')
    .subscribe({
        next: async (x) => {
            try {
                let tasks = [];

                tasks.push(Unbinding(IDB.RuleHumanDetection, x.data, 'areas'));
                tasks.push(Unbinding(IDB.RulePeopleCounting, x.data, 'areas'));
                tasks.push(Unbinding(IDB.RuleRepeatVisitor, x.data, 'areas'));
                tasks.push(Unbinding(IDB.RuleVisitor, x.data, 'areas'));

                await Promise.all(tasks);
            } catch (e) {
                Print.Log(e, new Error(), 'error');
            }
        },
    });

/**
 * Unbinding when device group was delete
 */
IDB.DeviceGroup.notice$
    .filter((x) => x.crud === 'd')
    .subscribe({
        next: async (x) => {
            try {
                let tasks = [];

                tasks.push(Unbinding(IDB.RuleHumanDetection, x.data, 'deviceGroups'));
                tasks.push(Unbinding(IDB.RulePeopleCounting, x.data, 'deviceGroups'));
                tasks.push(Unbinding(IDB.RuleRepeatVisitor, x.data, 'deviceGroups'));
                tasks.push(Unbinding(IDB.RuleVisitor, x.data, 'deviceGroups'));

                await Promise.all(tasks);
            } catch (e) {
                Print.Log(e, new Error(), 'error');
            }
        },
    });

/**
 * Unbinding when device was delete
 */
IDB.Device.notice$
    .filter((x) => x.crud === 'd')
    .subscribe({
        next: async (x) => {
            try {
                let tasks = [];

                tasks.push(Unbinding(IDB.RuleHumanDetection, x.data, 'devices'));
                tasks.push(Unbinding(IDB.RulePeopleCounting, x.data, 'devices'));
                tasks.push(Unbinding(IDB.RuleRepeatVisitor, x.data, 'devices'));
                tasks.push(Unbinding(IDB.RuleVisitor, x.data, 'devices'));

                await Promise.all(tasks);
            } catch (e) {
                Print.Log(e, new Error(), 'error');
            }
        },
    });

/**
 * Unbinding when user was delete
 */
IDB.UserInfo.notice$
    .filter((x) => x.crud === 'd')
    .subscribe({
        next: async (x) => {
            try {
                let tasks = [];

                tasks.push(Unbinding(IDB.RuleHumanDetection, x.data.get('user'), 'notifyObject', 'users'));
                tasks.push(Unbinding(IDB.RulePeopleCounting, x.data.get('user'), 'notifyObject', 'users'));
                tasks.push(Unbinding(IDB.RuleRepeatVisitor, x.data.get('user'), 'notifyObject', 'users'));
                tasks.push(Unbinding(IDB.RuleVisitor, x.data.get('user'), 'notifyObject', 'users'));

                await Promise.all(tasks);
            } catch (e) {
                Print.Log(e, new Error(), 'error');
            }
        },
    });

/**
 * Unbinding when user group was delete
 */
IDB.UserGroup.notice$
    .filter((x) => x.crud === 'd')
    .subscribe({
        next: async (x) => {
            try {
                let tasks = [];

                tasks.push(Unbinding(IDB.RuleHumanDetection, x.data, 'notifyObject', 'userGroups'));
                tasks.push(Unbinding(IDB.RulePeopleCounting, x.data, 'notifyObject', 'userGroups'));
                tasks.push(Unbinding(IDB.RuleRepeatVisitor, x.data, 'notifyObject', 'userGroups'));
                tasks.push(Unbinding(IDB.RuleVisitor, x.data, 'notifyObject', 'userGroups'));

                await Promise.all(tasks);
            } catch (e) {
                Print.Log(e, new Error(), 'error');
            }
        },
    });
