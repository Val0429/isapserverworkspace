import { IUser, Action, Restful, RoleList, Errors, ParseObject, ActionParam } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Db, Print } from '../../../custom/helpers';
import * as Enum from '../../../custom/enums';

let action = new Action({});

export default action;

/**
 * Action Create
 */
type InputC = IRequest.IUser.IResidentInfoIndexC;

type OutputC = IResponse.IUser.IResidentInfoIndexC;

action.post(
    {
        inputType: 'InputC',
        loginRequired: false,
        permission: [],
    },
    async (data): Promise<OutputC> => {
        try {
            let _input: InputC = data.inputType;

            let resident: IDB.CharacterResident = await new Parse.Query(IDB.CharacterResident)
                .equalTo('barcode', _input.barcode)
                .first()
                .fail((e) => {
                    throw e;
                });
            if (!resident) {
                throw Errors.throw(Errors.CustomBadRequest, ['resident is not found']);
            }

            let role: Parse.Role = await new Parse.Query(Parse.Role)
                .equalTo('name', RoleList.Resident)
                .first()
                .fail((e) => {
                    throw e;
                });

            let user: Parse.User = new Parse.User();
            user = await user
                .signUp(
                    {
                        username: _input.account,
                        password: _input.password,
                        data: {},
                        roles: [role],
                    },
                    {
                        useMasterKey: true,
                    },
                )
                .fail((e) => {
                    throw Errors.throw(Errors.CustomBadRequest, [e]);
                });

            let residentInfo: IDB.CharacterResidentInfo = new IDB.CharacterResidentInfo();

            residentInfo.setValue('community', resident.getValue('community'));
            residentInfo.setValue('user', user);
            residentInfo.setValue('resident', resident);
            residentInfo.setValue('name', _input.name);
            residentInfo.setValue('gender', _input.gender);
            residentInfo.setValue('birthday', _input.birthday);
            residentInfo.setValue('character', Enum.ResidentCharacter.resident);
            residentInfo.setValue('phone', _input.phone ? _input.phone : '');
            residentInfo.setValue('lineId', _input.lineId ? _input.lineId : '');
            residentInfo.setValue('email', _input.email ? _input.email : '');
            residentInfo.setValue('education', _input.education ? _input.education : '');
            residentInfo.setValue('career', _input.career ? _input.career : '');
            residentInfo.setValue('isEmail', true);
            residentInfo.setValue('isNotice', true);
            residentInfo.setValue('isDeleted', false);
            residentInfo.setValue('deviceToken', _input.deviceToken);
            residentInfo.setValue('deviceType', _input.deviceType);

            await residentInfo.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });

            return {
                userId: user.id,
            };
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);

/**
 * Action Read
 */
type InputR = IRequest.IUser.IResidentInfoIndexR;

type OutputR = IResponse.IUser.IResidentInfoIndexR[];

action.get(
    {
        inputType: 'InputR',
        loginRequired: true,
        permission: [RoleList.Chairman, RoleList.DeputyChairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral, RoleList.Guard],
    },
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;
            let _userInfo = await Db.GetUserInfo(data);

            let resident: IDB.CharacterResident = new IDB.CharacterResident();
            resident.id = _input.redsidentId;

            let residentInfos: IDB.CharacterResidentInfo[] = await new Parse.Query(IDB.CharacterResidentInfo)
                .equalTo('community', _userInfo.community)
                .equalTo('resident', resident)
                .equalTo('isDeleted', false)
                .find()
                .fail((e) => {
                    throw e;
                });

            return residentInfos.map((value, index, array) => {
                return {
                    userId: value.getValue('user').id,
                    name: value.getValue('name'),
                    gender: value.getValue('gender'),
                    birthday: value.getValue('birthday'),
                    phone: value.getValue('phone'),
                    lineId: value.getValue('lineId'),
                    email: value.getValue('email'),
                    education: value.getValue('education'),
                    career: value.getValue('career'),
                    character: value.getValue('character'),
                    isEmail: value.getValue('isEmail'),
                    isNotice: value.getValue('isNotice'),
                };
            });
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);

/**
 * Action update
 */
type InputU = IRequest.IUser.IResidentInfoIndexU;

type OutputU = Date;

action.put(
    {
        inputType: 'InputU',
        loginRequired: true,
        permission: [RoleList.Resident],
    },
    async (data): Promise<OutputU> => {
        try {
            let _input: InputU = data.inputType;
            let _userInfo = await Db.GetUserInfo(data);

            let user: Parse.User = new Parse.User();
            if (_input.userId) {
                user.id = _input.userId;
            } else {
                user = data.user;
            }

            let residentInfo: IDB.CharacterResidentInfo = await new Parse.Query(IDB.CharacterResidentInfo)
                .equalTo('community', _userInfo.community)
                .equalTo('user', user)
                .first()
                .fail((e) => {
                    throw e;
                });
            if (!residentInfo) {
                throw Errors.throw(Errors.CustomBadRequest, ['resident info not found']);
            }
            if (residentInfo.getValue('isDeleted')) {
                throw Errors.throw(Errors.CustomBadRequest, ['resident info was deleted']);
            }

            residentInfo.setValue('phone', _input.phone);
            residentInfo.setValue('lineId', _input.lineId);
            residentInfo.setValue('email', _input.email);
            residentInfo.setValue('education', _input.education);
            residentInfo.setValue('career', _input.career);
            residentInfo.setValue('isEmail', _input.isEmail);
            residentInfo.setValue('isNotice', _input.isNotice);

            await residentInfo.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });

            return new Date();
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);

/**
 * Action Delete
 */
type InputD = IRequest.IUser.IResidentInfoIndexD;

type OutputD = Date;

action.delete(
    {
        inputType: 'InputD',
        loginRequired: true,
        permission: [RoleList.Chairman, RoleList.DirectorGeneral],
    },
    async (data): Promise<OutputD> => {
        try {
            let _input: InputD = data.inputType;
            let _userInfo = await Db.GetUserInfo(data);
            let _userIds: string[] = [].concat(data.parameters.userIds);

            _userIds = _userIds.filter((value, index, array) => {
                return array.indexOf(value) === index;
            });

            let tasks: Promise<any>[] = _userIds.map<any>((value, index, array) => {
                let user: Parse.User = new Parse.User();
                user.id = value;

                return new Parse.Query(IDB.CharacterResidentInfo).equalTo('user', user).first();
            });
            let residentInfos: IDB.CharacterResidentInfo[] = await Promise.all(tasks).catch((e) => {
                throw e;
            });

            tasks = residentInfos.map<any>((value, index, array) => {
                value.setValue('isDeleted', true);

                return value.save(null, { useMasterKey: true });
            });
            await Promise.all(tasks).catch((e) => {
                throw e;
            });

            return new Date();
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
