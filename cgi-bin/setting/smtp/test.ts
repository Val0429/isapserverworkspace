import { IUser, Action, Restful, RoleList, Errors, Socket, Config } from 'core/cgi-package';
import { ScheduleActionEmail, ScheduleActionEmailResult } from 'core/scheduler-loader';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, Regex, Email, Db } from '../../../custom/helpers';
import * as Enum from '../../../custom/enums';

let action = new Action({
    loginRequired: true,
    permission: [RoleList.SuperAdministrator, RoleList.Admin],
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
    },
    async (data): Promise<OutputC> => {
        try {
            let _input: InputC = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);

            if (!Regex.IsEmail(_input.email)) {
                throw Errors.throw(Errors.CustomBadRequest, ['email format error']);
            }

            let email: Email = new Email();
            email.config = {
                host: Config.email.host,
                port: Config.email.port,
                email: Config.email.email,
                password: Config.email.password,
            };

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
