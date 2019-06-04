import { IUser, Action, Restful, RoleList, Errors, Socket, Config } from 'core/cgi-package';
import { default as Ast } from 'services/ast-services/ast-client';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, File, Parser, Db, Draw } from '../../../custom/helpers';
import * as Middleware from '../../../custom/middlewares';
import * as Enum from '../../../custom/enums';

let action = new Action({
    loginRequired: true,
    permission: [RoleList.SuperAdministrator, RoleList.Admin],
});

export default action;

type MultiData = IRequest.IMultiData;

/**
 * Action Read
 */
type InputR = null;

type OutputR = IResponse.IDevice.IGroupAll[];

action.get(
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);

            let query: Parse.Query<IDB.DeviceGroup> = new Parse.Query(IDB.DeviceGroup);

            let total: number = await query.count().fail((e) => {
                throw e;
            });

            let group: IDB.DeviceGroup[] = await query
                .limit(total)
                .find()
                .fail((e) => {
                    throw e;
                });

            return group.map((value, index, array) => {
                return {
                    objectId: value.id,
                    name: value.getValue('name'),
                };
            });
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
