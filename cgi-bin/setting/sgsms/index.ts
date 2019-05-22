import { IUser, Action, Restful, RoleList, Errors, Socket, Config } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, File, Sgsms } from '../../../custom/helpers';
import * as Enum from '../../../custom/enums';
import { UpdateConfig } from '../../config';

let action = new Action({
    loginRequired: true,
    permission: [RoleList.Admin],
});

export default action;

/**
 * Action Read
 */
type InputR = null;

type OutputR = IResponse.ISetting.ISgsmsR;

action.get(
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;

            let config = Config.sgSms;

            return {
                enable: config.enable,
                url: config.url,
                account: config.account,
                password: config.password,
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
type InputU = IRequest.ISetting.ISgsmsU;

type OutputU = Date;

action.put(
    { inputType: 'InputU' },
    async (data): Promise<OutputU> => {
        try {
            let _input: InputU = data.inputType;

            let sgsms: Sgsms = new Sgsms();
            sgsms.config = {
                url: Config.sgSms.url,
                account: Config.sgSms.account,
                password: Config.sgSms.password,
            };

            try {
                sgsms.Initialization();
            } catch (e) {
                throw Errors.throw(Errors.CustomBadRequest, [e]);
            }

            await UpdateConfig('sgSms', _input);
            Config['sgSms'] = { ...Config['sgSms'], ..._input };

            File.CopyFile('workspace/config/custom/sg-sms.ts', 'workspace/custom/assets/config/sg-sms.ts');

            return new Date();
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
