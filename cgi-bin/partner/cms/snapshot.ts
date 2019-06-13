import { IUser, Action, Restful, RoleList, Errors, Socket, Config } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, Db, CMSService, Draw, Parser } from '../../../custom/helpers';
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
type InputC = IRequest.IPartner.ICMSSnapshot_ObjectId | IRequest.IPartner.ICMSSnapshot_Config;

type OutputC = IResponse.IPartner.ICMSSnapshot;

action.post(
    {
        inputType: 'InputC',
    },
    async (data): Promise<OutputC> => {
        try {
            let _input: InputC = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);

            let config: CMSService.IConfig = undefined;
            if ('objectId' in _input) {
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
            } else {
                config = {
                    protocol: _input.config.protocol,
                    ip: _input.config.ip,
                    port: _input.config.port,
                    account: _input.config.account,
                    password: _input.config.password,
                };
            }

            let cms: CMSService = new CMSService();
            cms.config = config;

            cms.Initialization();

            let snapshot = await cms.GetSnapshot(_input.nvrId, _input.channelId);
            let size = await Draw.ImageSize(snapshot);

            snapshot = await Draw.Resize(snapshot, { width: 960, height: 540 }, false, false);

            return {
                cameraWidth: size.width,
                cameraHeight: size.height,
                snapshotBase64: Parser.Base64Str2HtmlSrc(snapshot.toString(Parser.Encoding.base64)),
            };
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
