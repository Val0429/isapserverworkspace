import { IUser, Action, Restful, RoleList, Errors, ParseObject } from 'core/cgi-package';
import { IRequest, IResponse, CharacterResident, CharacterResidentInfo } from '../../../custom/models';

let action = new Action({});

export default action;

/**
 * Action Create
 */
type InputC = IRequest.IUser.IResidentInfoIndexC;

type OutputC = IResponse.IUser.IResidentInfoIndexC;

action.post(
    { inputType: 'InputC', loginRequired: false },
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

        residentInfo.setValue('user', user);
        residentInfo.setValue('resident', resident);
        residentInfo.setValue('name', _input.name);
        residentInfo.setValue('gender', _input.gender);
        residentInfo.setValue('birthday', _input.birthday);

        residentInfo.setValue('phone', _input.phone ? _input.phone : '');
        residentInfo.setValue('lineId', _input.lineId ? _input.lineId : '');
        residentInfo.setValue('email', _input.email ? _input.email : '');
        residentInfo.setValue('education', _input.education ? _input.education : '');
        residentInfo.setValue('career', _input.career ? _input.career : '');

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

type OutputR = IResponse.IUser.IResidentInfoIndexR | IResponse.IUser.IResidentInfoIndexR[];

action.get(
    { inputType: 'InputR', loginRequired: true, permission: [] },
    async (data): Promise<OutputR> => {
        let _input: InputR = data.inputType;

        if (_input.redsidentId) {
            let roles: RoleList[] = data.role.map((value, index, array) => {
                return value.get('name');
            });
            if (roles.indexOf(RoleList.Resident) > -1) {
                throw Errors.throw(Errors.PermissionDenied);
            }

            let resident: CharacterResident = new CharacterResident();
            resident.id = _input.redsidentId;

            let residentInfos: CharacterResidentInfo[] = await new Parse.Query(CharacterResidentInfo)
                .equalTo('resident', resident)
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
                };
            });
        } else {
            let residentInfo: CharacterResidentInfo = await new Parse.Query(CharacterResidentInfo)
                .equalTo('user', data.user)
                .first()
                .catch((e) => {
                    throw e;
                });

            if (!residentInfo) {
                throw Errors.throw(Errors.CustomBadRequest, ['user not found']);
            }

            return {
                userId: residentInfo.getValue('user').id,
                name: residentInfo.getValue('name'),
                gender: residentInfo.getValue('gender'),
                birthday: residentInfo.getValue('birthday'),
                phone: residentInfo.getValue('phone'),
                lineId: residentInfo.getValue('lineId'),
                email: residentInfo.getValue('email'),
                education: residentInfo.getValue('education'),
                career: residentInfo.getValue('career'),
            };
        }
    },
);

/**
 * Action update
 */
type InputU = IRequest.IUser.IResidentInfoIndexU;

type OutputU = string;

action.put(
    { inputType: 'InputR', loginRequired: true, permission: [RoleList.Resident] },
    async (data): Promise<OutputU> => {
        let _input: InputU = data.inputType;

        let user: Parse.User = new Parse.User();
        user.id = _input.userId;
        let residentInfo: CharacterResidentInfo = await new Parse.Query(CharacterResidentInfo)
            .equalTo('user', user)
            .first()
            .catch((e) => {
                throw e;
            });

        residentInfo.setValue('phone', _input.phone);
        residentInfo.setValue('lineId', _input.lineId);
        residentInfo.setValue('email', _input.email);
        residentInfo.setValue('education', _input.education);
        residentInfo.setValue('career', _input.career);

        await residentInfo.save(null, { useMasterKey: true }).catch((e) => {
            throw e;
        });

        return '';
    },
);

/**
 * Action Delete
 */
type InputD = IRequest.IUser.IResidentInfoIndexD;

type OutputD = string;

action.delete(
    { inputType: 'InputD' },
    async (data): Promise<OutputD> => {
        let _input: InputD = data.inputType;

        let tasks: Promise<any>[] = [].concat(
            ..._input.userIds.map((value, index, array) => {
                let user: Parse.User = new Parse.User();
                user.id = value;

                return [new Parse.Query(Parse.User).get(value), new Parse.Query(CharacterResidentInfo).equalTo('user', user).first()];
            }),
        );
        let datas: (Parse.User | CharacterResidentInfo)[] = await Promise.all(tasks).catch((e) => {
            throw e;
        });

        tasks = datas.map((value, index, array) => {
            return value.destroy({ useMasterKey: true });
        });
        await Promise.all(tasks).catch((e) => {
            throw e;
        });

        return '';
    },
);
