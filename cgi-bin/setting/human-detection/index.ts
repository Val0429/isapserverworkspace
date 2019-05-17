import { IUser, Action, Restful, RoleList, Errors, Socket, Config } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, File, HumanDetection } from '../../../custom/helpers';
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

            let hd: HumanDetection.ISap = new HumanDetection.ISap();
            hd.config = {
                protocol: _input.protocol,
                ip: _input.ip,
                port: _input.port,
            };

            hd.Initialization();

            await UpdateConfig('humanDetection', _input);
            Config['humanDetection'] = { ...Config['humanDetection'], ..._input };

            File.CopyFile('workspace/config/custom/human-detection.ts', 'workspace/custom/assets/config/human-detection.ts');

            return new Date();
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
