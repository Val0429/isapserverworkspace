import { IUser, Action, Restful, RoleList, Errors, Socket } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, Regex, Email, File, Db } from '../../../custom/helpers';
import * as Enum from '../../../custom/enums';
import { default as DataCenter } from '../../../custom/services/data-center';

let action = new Action({
    loginRequired: true,
});

export default action;

/**
 * Action Read
 */
type InputR = null;

type OutputR = IResponse.ISetting.ISmtpR;

action.get(
    {
        permission: [RoleList.SystemAdministrator, RoleList.Administrator],
    },
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);

            let setting = DataCenter.emailSetting$.value;

            return {
                enable: setting.enable,
                host: setting.host,
                port: setting.port,
                email: setting.email,
                password: setting.password,
            };
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);

/**
 * Action update
 */
type InputU = IRequest.ISetting.ISmtpU;

type OutputU = Date;

action.put(
    {
        inputType: 'InputU',
        permission: [RoleList.SystemAdministrator, RoleList.Administrator],
    },
    async (data): Promise<OutputU> => {
        try {
            let _input: InputU = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);

            if (!Regex.IsEmail(_input.email)) {
                throw Errors.throw(Errors.CustomBadRequest, ['email format error']);
            }

            let email: Email = new Email();
            email.config = {
                host: _input.host,
                port: _input.port,
                email: _input.email,
                password: _input.password,
            };

            try {
                email.Initialization();
            } catch (e) {
                throw Errors.throw(Errors.CustomBadRequest, [e]);
            }

            DataCenter.emailSetting$.next({
                enable: _input.enable,
                host: _input.host,
                port: _input.port,
                email: _input.email,
                password: _input.password,
            });

            return new Date();
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
