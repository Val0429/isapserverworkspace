import { IUser, Action, Restful, RoleList, Errors, ParseObject, ActionParam } from 'core/cgi-package';
import { IRequest, IResponse, CharacterResident, CharacterResidentInfo } from '../../../custom/models';
import { Db } from '../../../custom/helpers';
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
        let _input: InputC = data.inputType;

        let resident: CharacterResident = await new Parse.Query(CharacterResident)
            .equalTo('barcode', _input.barcode)
            .first()
            .catch((e) => {
                throw e;
            });
        if (!resident) {
            throw Errors.throw(Errors.CustomBadRequest, ['resident is not found']);
        }

        let role: Parse.Role = await new Parse.Query(Parse.Role)
            .equalTo('name', RoleList.Resident)
            .first()
            .catch((e) => {
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
            .catch((e) => {
                throw Errors.throw(Errors.CustomBadRequest, [e]);
            });

        let residentInfo: CharacterResidentInfo = new CharacterResidentInfo();

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

        await residentInfo.save(null, { useMasterKey: true }).catch((e) => {
            throw e;
        });

        return {
            userId: user.id,
        };
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
        let _input: InputR = data.inputType;
        let _userInfo = await Db.GetUserInfo(data);

        let resident: CharacterResident = new CharacterResident();
        resident.id = _input.redsidentId;

        let residentInfos: CharacterResidentInfo[] = await new Parse.Query(CharacterResidentInfo)
            .equalTo('community', _userInfo.community)
            .equalTo('resident', resident)
            .equalTo('isDeleted', false)
            .find()
            .catch((e) => {
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
        let _input: InputU = data.inputType;
        let _userInfo = await Db.GetUserInfo(data);

        let user: Parse.User = new Parse.User();
        if (_input.userId) {
            user.id = _input.userId;
        } else {
            user = data.user;
        }

        let residentInfo: CharacterResidentInfo = await new Parse.Query(CharacterResidentInfo)
            .equalTo('community', _userInfo.community)
            .equalTo('user', user)
            .first()
            .catch((e) => {
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

        await residentInfo.save(null, { useMasterKey: true }).catch((e) => {
            throw e;
        });

        return new Date();
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
        let _input: InputD = data.inputType;
        let _userInfo = await Db.GetUserInfo(data);
        let _userIds: string[] = [].concat(data.parameters.userIds);

        _userIds = _userIds.filter((value, index, array) => {
            return array.indexOf(value) === index;
        });

        let tasks: Promise<any>[] = _userIds.map((value, index, array) => {
            let user: Parse.User = new Parse.User();
            user.id = value;

            return new Parse.Query(CharacterResidentInfo).equalTo('user', user).first();
        });
        let residentInfos: CharacterResidentInfo[] = await Promise.all(tasks).catch((e) => {
            throw e;
        });

        tasks = residentInfos.map((value, index, array) => {
            value.setValue('isDeleted', true);

            return value.save(null, { useMasterKey: true });
        });
        await Promise.all(tasks).catch((e) => {
            throw e;
        });

        return new Date();
    },
);
