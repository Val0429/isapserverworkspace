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
type InputC = IRequest.IUser.IBaseLogin_User | IRequest.IUser.IBaseLogin_SessionId;

type OutputC = IResponse.IUser.IBaseLogin;

action.post(
    {
        inputType: 'InputC',
    },
    async (data): Promise<OutputC> => {
        try {
            let _input: InputC = data.inputType;

            let user: Parse.User = undefined;
            let sessionId: string = '';

            if ('account' in _input) {
                let login = await UserHelper.login({
                    username: _input.account,
                    password: _input.password,
                }).catch((e) => {
                    throw e;
                });

                user = login.user;
                sessionId = login.sessionId;
            } else {
                user = data.user;
                sessionId = _input.sessionId;
            }

            let roles: string[] = user.get('roles').map((value, index, array) => {
                return value.get('name');
            });

            let event: EventLogin = new EventLogin({
                owner: user,
            });
            await Events.save(event).catch((e) => {
                throw e;
            });

            return {
                sessionId: sessionId,
                objectId: user.id,
                roles: roles.map((value, index, array) => {
                    return Object.keys(RoleList).find((value1, index1, array1) => {
                        return value === RoleList[value1];
                    });
                }),
            };
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
