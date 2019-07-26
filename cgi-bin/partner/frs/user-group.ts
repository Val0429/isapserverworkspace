import { IUser, Action, Restful, RoleList, Errors, Socket, Config } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, Db, FRSService } from '../../../custom/helpers';
import * as Enum from '../../../custom/enums';
import { GetUserGroup } from './';

let action = new Action({
    loginRequired: true,
});

export default action;

/**
 * Action Create
 */
type InputC = IRequest.IPartner.IFRSUserGroup_ObjectId | IRequest.IPartner.IFRSUserGroup_Config;

type OutputC = FRSService.IObject[];

action.post(
    {
        inputType: 'InputC',
        permission: [RoleList.SuperAdministrator, RoleList.Admin],
    },
    async (data): Promise<OutputC> => {
        try {
            let _input: InputC = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);

            let config: FRSService.IConfig = undefined;
            if ('objectId' in _input) {
                let server: IDB.ServerFRS = await new Parse.Query(IDB.ServerFRS)
                    .equalTo('objectId', _input.objectId)
                    .first()
                    .fail((e) => {
                        throw e;
                    });
                if (!server) {
                    throw Errors.throw(Errors.CustomBadRequest, ['server not found']);
                }

                config = {
                    protocol: server.getValue('protocol'),
                    ip: server.getValue('ip'),
                    port: server.getValue('port'),
                    wsport: server.getValue('wsport'),
                    account: server.getValue('account'),
                    password: server.getValue('password'),
                };
            } else {
                config = _input.config;
            }

            let groups = await GetUserGroup(config);

            return groups;
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
