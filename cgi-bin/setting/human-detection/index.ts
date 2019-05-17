import { IUser, Action, Restful, RoleList, Errors, Socket, Config } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, File, Regex } from '../../../custom/helpers';
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

type OutputR = IResponse.ISetting.IHumanDetectionR;

action.get(
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;

            let config = Config.humanDetection;

            return {
                protocol: config.protocol,
                ip: config.ip,
                port: config.port,
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
type InputU = IRequest.ISetting.IHumanDetectionU;

type OutputU = Date;

action.put(
    { inputType: 'InputU' },
    async (data): Promise<OutputU> => {
        try {
            let _input: InputU = data.inputType;

            if (!Regex.IsIp(_input.ip)) {
                throw Errors.throw(Errors.CustomBadRequest, ['ip error']);
            }
            if (!Regex.IsPort(_input.port.toString())) {
                throw Errors.throw(Errors.CustomBadRequest, ['port error']);
            }

            await UpdateConfig('humanDetection', _input);
            Config['humanDetection'] = { ...Config['humanDetection'], ..._input };

            File.CopyFile('workspace/config/custom/human-detection.ts', 'workspace/custom/assets/config/custom/human-detection.ts');

            return new Date();
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
