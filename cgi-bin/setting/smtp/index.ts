import { IUser, Action, Restful, RoleList, Errors, Socket, Config } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, Regex, Email, File } from '../../../custom/helpers';
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

type OutputR = IResponse.ISetting.ISmtpR;

action.get(
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;

            let config = Config.email;

            return {
                enable: config.enable,
                host: config.host,
                port: config.port,
                email: config.email,
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
type InputU = IRequest.ISetting.ISmtpU;

type OutputU = Date;

action.put(
    { inputType: 'InputU' },
    async (data): Promise<OutputU> => {
        try {
            let _input: InputU = data.inputType;

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

            try {
                email.Initialization();
            } catch (e) {
                throw Errors.throw(Errors.CustomBadRequest, [e]);
            }

            await UpdateConfig('email', _input);
            Config['email'] = { ...Config['email'], ..._input };

            File.CopyFile('workspace/config/custom/email.ts', 'workspace/custom/assets/config/email.ts');

            return new Date();
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
