import { Action, Errors, EventLogin, Events, UserHelper, ParseObject, RoleList } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import {} from '../../../custom/helpers';
import * as Enum from '../../../custom/enums';

let action = new Action({
    loginRequired: false,
    permission: [],
});

export default action;

/**
 * Action Login
 */
type InputC = IRequest.IUser.IBaseLogin;

type OutputC = IResponse.IUser.IUserLogin;

action.post(
    { inputType: 'InputC' },
    async (data): Promise<OutputC> => {
        let _input: InputC = data.inputType;

        let user = await UserHelper.login({
            username: _input.account,
            password: _input.password,
        }).catch((e) => {
            throw e;
        });

        let roles: string[] = user.user.get('roles').map((value, index, array) => {
            return value.get('name');
        });

        let event: EventLogin = new EventLogin({
            owner: user.user,
        });
        await Events.save(event).catch((e) => {
            throw e;
        });

        let info: IDB.UserInfo = await new Parse.Query(IDB.UserInfo)
            .equalTo('user', user.user)
            .equalTo('isDeleted', false)
            .first()
            .fail((e) => {
                throw e;
            });
        if (!info) {
            throw Errors.throw(Errors.CustomBadRequest, ['user info not found']);
        }

        return {
            sessionId: user.sessionId,
            userId: user.user.id,
            name: info.getValue('name'),
            roles: roles.map((value, index, array) => {
                return Object.keys(RoleList).find((value1, index1, array1) => {
                    return value === RoleList[value1];
                });
            }),
        };
    },
);
