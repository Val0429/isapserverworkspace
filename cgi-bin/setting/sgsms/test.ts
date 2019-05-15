import { IUser, Action, Restful, RoleList, Errors, Socket, Config } from 'core/cgi-package';
import { ScheduleActionSGSMS, ScheduleActionSMSResult } from 'core/scheduler-loader';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, Regex, Sgsms } from '../../../custom/helpers';
import * as Enum from '../../../custom/enums';

let action = new Action({
    loginRequired: true,
    permission: [RoleList.Admin],
});

export default action;

/**
 * Action Create
 */
type InputC = IRequest.ISetting.ISgsmsTest;

type OutputC = Date;

action.post(
    { inputType: 'InputC' },
    async (data): Promise<OutputC> => {
        try {
            let _input: InputC = data.inputType;

            if (!Regex.IsInternationalPhone(_input.phone)) {
                throw Errors.throw(Errors.CustomBadRequest, ['phone format error']);
            }

            let sgsms: Sgsms = new Sgsms();
            sgsms.config = {
                url: Config.textMessage.sg.url,
                account: Config.textMessage.sg.account,
                password: Config.textMessage.sg.password,
            };

            sgsms.Initialization();

            let result: string = await sgsms.Send('Test', 'Test message !!', _input.phone);

            return new Date();
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
