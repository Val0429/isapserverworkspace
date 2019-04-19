import { IUser, Action, Restful, RoleList, Errors, Socket, Config } from 'core/cgi-package';
import { ScheduleActionSGSMS, ScheduleActionSMSResult } from 'core/scheduler-loader';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print } from '../../../custom/helpers';
import * as Enum from '../../../custom/enums';

let action = new Action({
    loginRequired: true,
    permission: [RoleList.Admin],
});

export default action;

/**
 * Action Create
 */
type InputC = IRequest.ISetting.ISgsmsCheck;

type OutputC = Date;

action.post(
    { inputType: 'InputC' },
    async (data): Promise<OutputC> => {
        try {
            let _input: InputC = data.inputType;

            if (!/^\+{1}[0-9]+$/.test(_input.phone)) {
                throw Errors.throw(Errors.CustomBadRequest, ['phone format error']);
            }

            let result = await new ScheduleActionSGSMS().do({
                phone: _input.phone,
                from: 'Test',
                message: 'test message',
                username: Config.sgsms.username,
                password: Config.sgsms.password,
            });

            switch (result) {
                case ScheduleActionSMSResult.Disabled:
                    throw Errors.throw(Errors.CustomBadRequest, ['sgsms was disabled']);
                case ScheduleActionSMSResult.Failed:
                    throw Errors.throw(Errors.CustomBadRequest, ['sgsms send failed']);
                case ScheduleActionSMSResult.Success:
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
