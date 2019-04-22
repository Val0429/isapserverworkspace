import { IUser, Action, Restful, RoleList, Errors, Socket, Config } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../custom/models';
import { Print, CMSService } from '../../custom/helpers';
import * as Enum from '../../custom/enums';

let action = new Action({
    loginRequired: true,
});

export default action;

/**
 * Action Read
 */
type InputR = null;

type OutputR = CMSService.INvr[];

action.get(
    {
        permission: [RoleList.Admin, RoleList.User],
    },
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;

            let cms: CMSService = new CMSService();
            cms.config = Config.cms;

            cms.Initialization();

            let nvrs: CMSService.INvr[] = await cms.GetDeviceList();

            return nvrs;
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
