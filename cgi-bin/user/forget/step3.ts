import { IUser, Action, Restful, RoleList, Errors, Socket } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print } from '../../../custom/helpers';
import * as Enum from '../../../custom/enums';
import { Login } from '../user/login';

let action = new Action({
    loginRequired: false,
});

export default action;

/**
 * Action Create
 */
type InputC = IRequest.IUser.IForgetStep3;

type OutputC = IResponse.IUser.IForgetStep3;

action.post(
    {
        inputType: 'InputC',
        permission: [],
    },
    async (data): Promise<OutputC> => {
        try {
            let _input: InputC = data.inputType;

            if (!_input.password || _input.password.length === 0) {
                throw Errors.throw(Errors.CustomBadRequest, ['password can not be empty']);
            }

            let user: Parse.User = await new Parse.Query(Parse.User)
                .equalTo('username', _input.username)
                .first()
                .fail((e) => {
                    throw e;
                });
            if (!user) {
                throw Errors.throw(Errors.CustomBadRequest, ['user not found']);
            }

            let info: IDB.UserInfo = await new Parse.Query(IDB.UserInfo)
                .equalTo('user', user)
                .first()
                .fail((e) => {
                    throw e;
                });
            if (!info) {
                throw Errors.throw(Errors.CustomBadRequest, ['user not found']);
            }
            if (info.getValue('forgetVerification') !== _input.verification) {
                throw Errors.throw(Errors.CustomBadRequest, ['verification error']);
            }
            if (info.getValue('forgetExpireDate').getTime() < new Date().getTime()) {
                throw Errors.throw(Errors.CustomBadRequest, ['verification expired']);
            }

            user.setPassword(_input.password);

            await user.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });

            info.unset('forgetVerification');
            info.unset('forgetExpireDate');

            await info.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });

            return await Login(data, {
                username: _input.username,
                password: _input.password,
            });
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
