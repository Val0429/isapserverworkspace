import { Action, Errors, EventLogin, Events, UserHelper, ParseObject, RoleList } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print } from '../../../custom/helpers';
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

type OutputC = IResponse.IUser.IBaseLogin;

action.post(
    { inputType: 'InputC' },
    async (data): Promise<OutputC> => {
        try {
            let _input: InputC = data.inputType;

            let user = await UserHelper.login({
                username: _input.account,
                password: _input.password,
            }).catch((e) => {
                throw e;
            });

            let roles: string[] = user.user.get('roles').map((value, index, array) => {
                return Object.keys(RoleList).find((value1, index1, array1) => {
                    return value.get('name') === RoleList[value1];
                });
            });

            if (!(roles.indexOf('SystemAdministrator') > -1 || roles.indexOf('Administrator') > -1)) {
                throw Errors.throw(Errors.LoginFailed);
            }

            let event: EventLogin = new EventLogin({
                owner: user.user,
            });
            await Events.save(event).catch((e) => {
                throw e;
            });

            return {
                sessionId: user.sessionId,
                userId: user.user.id,
                roles: roles,
            };
        } catch (e) {
            Print.Log(new Error(JSON.stringify(e)), 'error');
            throw e;
        }
    },
);
