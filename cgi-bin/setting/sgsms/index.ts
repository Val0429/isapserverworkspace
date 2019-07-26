import { IUser, Action, Restful, RoleList, Errors, Socket, Config } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, File, Db, Sgsms } from '../../../custom/helpers';
import * as Enum from '../../../custom/enums';
import { UpdateConfig } from '../../config';

let action = new Action({
    loginRequired: true,
});

export default action;

/**
 * Action Read
 */
type InputR = null;

type OutputR = IResponse.ISetting.ISgsmsR;

action.get(
    {
        permission: [RoleList.SuperAdministrator, RoleList.Admin],
    },
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);

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
    {
        inputType: 'InputU',
        permission: [RoleList.SuperAdministrator, RoleList.Admin],
    },
    async (data): Promise<OutputU> => {
        try {
            let _input: InputU = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);

            let sgsms: Sgsms = new Sgsms();
            sgsms.config = {
                url: _input.url,
                account: _input.account,
                password: _input.password,
            };

            try {
                sgsms.Initialization();
            } catch (e) {
                throw Errors.throw(Errors.CustomBadRequest, [e]);
            }

            await UpdateConfig('sgSms', _input);
            Config['sgSms'] = { ...Config['sgSms'], ..._input };

            Print.Log('Write sgsms config', new Error(), 'warning', { now: true });
            File.WriteFile('workspace/custom/assets/config/sg-sms.json', JSON.stringify(_input));

            return new Date();
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
