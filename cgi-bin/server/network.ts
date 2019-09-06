import { IUser, Action, Restful, RoleList, Errors, Socket } from 'core/cgi-package';
import { Tree, IGetTreeNodeR, IGetTreeNodeL } from 'models/nodes';
import { IRequest, IResponse, IDB } from '../../custom/models';
import { Print, Db, Utility } from '../../custom/helpers';
import * as Enum from '../../custom/enums';

let action = new Action({
    loginRequired: true,
});

export default action;

/**
 * Action Read
 */
type InputR = null;

type OutputR = Utility.INetwork[];

action.get(
    {
        permission: [RoleList.Administrator],
    },
    async (data): Promise<OutputR> => {
        try {
            let _userInfo = await Db.GetUserInfo(data.request, data.user);

            return Utility.GetNetwork();
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
