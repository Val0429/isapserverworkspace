import { IUser, Action, Restful, RoleList, Errors, Socket, Config } from 'core/cgi-package';
import { default as Ast } from 'services/ast-services/ast-client';
import { IRequest, IResponse, IDB } from '../../custom/models';
import { Print, File, Parser, Db, Draw } from '../../custom/helpers';
import * as Middleware from '../../custom/middlewares';
import * as Enum from '../../custom/enums';

let action = new Action({
    loginRequired: true,
});

export default action;

type MultiData = IRequest.IMultiData;

/**
 * Action Read
 */
type InputR = null;

type OutputR = IResponse.IOfficeHour.IAll[];

action.get(
    {
        permission: [RoleList.SuperAdministrator, RoleList.Admin, RoleList.User],
    },
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);

            let query: Parse.Query<IDB.OfficeHour> = new Parse.Query(IDB.OfficeHour);

            let total: number = await query.count().fail((e) => {
                throw e;
            });

            let officeHours: IDB.OfficeHour[] = await query
                .limit(total)
                .find()
                .fail((e) => {
                    throw e;
                });

            return officeHours.map((value, index, array) => {
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
