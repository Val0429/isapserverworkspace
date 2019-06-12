import { IUser, Action, Restful, RoleList, Errors, Socket, Config } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, File, Db } from '../../../custom/helpers';
import * as Enum from '../../../custom/enums';
import { UpdateConfig } from '../../config';

let action = new Action({
    loginRequired: true,
    permission: [RoleList.SuperAdministrator, RoleList.Admin],
});

export default action;

/**
 * Action Read
 */
type InputR = null;

type OutputR = IResponse.ISetting.IPushNotificationR;

action.get(
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);

            let config = Config.pushNotification;

            return {
                enable: config.enable,
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
type InputU = IRequest.ISetting.IPushNotificationU;

type OutputU = Date;

action.put(
    {
        inputType: 'InputU',
    },
    async (data): Promise<OutputU> => {
        try {
            let _input: InputU = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);

            await UpdateConfig('pushNotification', _input);
            Config['pushNotification'] = { ...Config['pushNotification'], ..._input };

            Print.Log('Write push notification config', new Error(), 'warning', { now: true });
            File.CopyFile('workspace/config/custom/push-notification.ts', 'workspace/custom/assets/config/push-notification.ts');

            return new Date();
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
