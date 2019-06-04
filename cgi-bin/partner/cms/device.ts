import { IUser, Action, Restful, RoleList, Errors, Socket, Config } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, Db, CMSService } from '../../../custom/helpers';
import * as Enum from '../../../custom/enums';
import { GetDeviceTree } from './';

let action = new Action({
    loginRequired: true,
    permission: [RoleList.SuperAdministrator, RoleList.Admin],
});

export default action;

/**
 * Action Create
 */
type InputC = IRequest.IPartner.ICMSDevice;

type OutputC = CMSService.INvr[];

action.post(
    {
        inputType: 'InputC',
    },
    async (data): Promise<OutputC> => {
        try {
            let _input: InputC = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);

            let config: CMSService.IConfig = undefined;
            if (_input.objectId) {
                let server: IDB.ServerCMS = await new Parse.Query(IDB.ServerCMS)
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
            } else if (_input.config) {
                config = {
                    protocol: _input.config.protocol,
                    ip: _input.config.ip,
                    port: _input.config.port,
                    account: _input.config.account,
                    password: _input.config.password,
                };
            } else {
                throw Errors.throw(Errors.CustomBadRequest, ['need objectId or config']);
            }

            let devices = await GetDeviceTree(config);

            return devices;
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
