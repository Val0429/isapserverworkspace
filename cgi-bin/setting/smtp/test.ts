import { IUser, Action, Restful, RoleList, Errors, Socket, Config } from 'core/cgi-package';
import { ScheduleActionEmail, ScheduleActionEmailResult } from 'core/scheduler-loader';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, Regex, Email, Db } from '../../../custom/helpers';
import * as Enum from '../../../custom/enums';
import { default as DataCenter } from '../../../custom/services/data-center';

let action = new Action({
    loginRequired: true,
});

export default action;

/**
 * Action Create
 */
type InputC = IRequest.ISetting.ISmtpTest;

type OutputC = Date;

action.post(
    {
        inputType: 'InputC',
        permission: [RoleList.Administrator],
    },
    async (data): Promise<OutputC> => {
        try {
            let _input: InputC = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);

            if (!Regex.IsEmail(_input.email)) {
                throw Errors.throw(Errors.CustomBadRequest, ['email format error']);
            }

            let email: Email = new Email();
            if (_input.config) {
                email.config = {
                    host: _input.config.host,
                    port: _input.config.port,
                    email: _input.config.email,
                    password: _input.config.password,
                };
            } else {
                let setting = DataCenter.emailSetting$.value;

                email.config = {
                    host: setting.host,
                    port: setting.port,
                    email: setting.email,
                    password: setting.password,
                };
            }

            email.Initialization();

            let result = await email.Send('Test', 'Test message !!', {
                tos: [_input.email],
            });

            return new Date();
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
