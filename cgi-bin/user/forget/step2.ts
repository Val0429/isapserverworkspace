import { IUser, Action, Restful, RoleList, Errors, Socket } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print } from '../../../custom/helpers';
import * as Enum from '../../../custom/enums';

let action = new Action({
    loginRequired: false,
});

export default action;

/**
 * Action Create
 */
type InputC = IRequest.IUser.IForgetStep2;

type OutputC = Date;

action.post(
    {
        inputType: 'InputC',
        permission: [],
    },
    async (data): Promise<OutputC> => {
        try {
            let _input: InputC = data.inputType;

            let info: IDB.UserInfo = await new Parse.Query(IDB.UserInfo)
                .equalTo('account', _input.username)
                .include('user')
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

            return new Date();
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
