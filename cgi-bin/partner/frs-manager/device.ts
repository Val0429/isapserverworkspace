import { IUser, Action, Restful, RoleList, Errors, Socket, Config } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, Db, FRSManagerService } from '../../../custom/helpers';
import * as Enum from '../../../custom/enums';
import { GetDeviceList } from './';

let action = new Action({
    loginRequired: true,
});

export default action;

/**
 * Action Create
 */
type InputC = IRequest.IPartner.IFRSManagerDevice_ObjectId | IRequest.IPartner.IFRSManagerDevice_Config;

type OutputC = FRSManagerService.IFRSDevice[];

action.post(
    {
        inputType: 'InputC',
        permission: [RoleList.SuperAdministrator, RoleList.Admin],
    },
    async (data): Promise<OutputC> => {
        try {
            let _input: InputC = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);

            let config: FRSManagerService.IConfig = undefined;
            if ('objectId' in _input) {
                let server: IDB.ServerFRSManager = await new Parse.Query(IDB.ServerFRSManager)
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
                    account: server.getValue('account'),
                    password: server.getValue('password'),
                };
            } else {
                config = _input.config;
            }

            let devices = await GetDeviceList(config);

            return devices;
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
