import { IUser, Action, Restful, RoleList, Errors, Socket, Config } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, Utility, Email } from '../../../custom/helpers';
import * as Enum from '../../../custom/enums';
import { Login } from '../user/login';

let action = new Action({
    loginRequired: false,
});

export default action;

/**
 * Action Create
 */
type InputC = IRequest.IUser.IEnableStep1;

type OutputC = IResponse.IUser.IUserLogin;

action.post(
    {
        inputType: 'InputC',
        permission: [],
    },
    async (data): Promise<OutputC> => {
        try {
            let _input: InputC = data.inputType;

            let info: IDB.UserInfo = await new Parse.Query(IDB.UserInfo)
                .equalTo('enableVerification', _input.verification)
                .include('user')
                .first()
                .fail((e) => {
                    throw e;
                });
            if (!info) {
                throw Errors.throw(Errors.CustomBadRequest, ['user not found']);
            }
            if (info.getValue('enableExpireDate').getTime() < new Date().getTime()) {
                throw Errors.throw(Errors.CustomBadRequest, ['verification expired']);
            }

            let user: Parse.User = info.getValue('user');

            user.setPassword(_input.password);

            await user.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });

            info.unset('enableVerification');
            info.unset('enableExpireDate');

            await info.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });

            return await Login(data, {
                username: user.getUsername(),
                password: _input.password,
            });
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
