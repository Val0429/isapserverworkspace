import { IUser, Action, Restful, RoleList, Errors, Socket } from 'core/cgi-package';
import { ScheduleActionEmail, ScheduleActionEmailResult } from 'core/scheduler-loader';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, Regex } from '../../../custom/helpers';
import * as Enum from '../../../custom/enums';

let action = new Action({
    loginRequired: true,
    permission: [RoleList.Admin],
});

export default action;

/**
 * Action Create
 */
type InputC = IRequest.ISetting.ISmtpCheck;

type OutputC = Date;

action.post(
    { inputType: 'InputC' },
    async (data): Promise<OutputC> => {
        try {
            let _input: InputC = data.inputType;

            if (!Regex.IsEmail(_input.email)) {
                throw Errors.throw(Errors.CustomBadRequest, ['email format error']);
            }

            let result = await new ScheduleActionEmail().do({
                to: [_input.email],
                subject: 'Test',
                body: 'test message',
            });

            switch (result) {
                case ScheduleActionEmailResult.Disabled:
                    throw Errors.throw(Errors.CustomBadRequest, ['email was disabled']);
                case ScheduleActionEmailResult.Failed:
                    throw Errors.throw(Errors.CustomBadRequest, ['email send failed']);
                case ScheduleActionEmailResult.Success:
                    return new Date();
                default:
                    throw Errors.throw(Errors.CustomBadRequest, ['error']);
            }
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
