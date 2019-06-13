import { IUser, Action, Restful, RoleList, Errors, Socket, Config } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, Db, Parser, File, Draw, Demographic } from '../../../custom/helpers';
import * as Enum from '../../../custom/enums';
import { GetAnalysis } from './';

let action = new Action({
    loginRequired: true,
    permission: [RoleList.SuperAdministrator, RoleList.Admin],
});

export default action;

/**
 * Action Create
 */
type InputC = IRequest.IPartner.IDemographicTest_ObjectId | IRequest.IPartner.IDemographicTest_Config;

type OutputC = IResponse.IPartner.IDemographicTest[];

action.post(
    {
        inputType: 'InputC',
        postSizeLimit: 10000000,
    },
    async (data): Promise<OutputC> => {
        try {
            let _input: InputC = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);

            let extension = File.GetBase64Extension(_input.imageBase64);
            if (!extension || extension.type !== 'image') {
                throw Errors.throw(Errors.CustomBadRequest, ['media type error']);
            }

            let config: Demographic.ISap.IUrlConfig = undefined;
            let margin: number = 0;
            if ('objectId' in _input) {
                let server: IDB.ServerDemographic = await new Parse.Query(IDB.ServerDemographic)
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
                };
                margin = server.getValue('margin');
            } else {
                config = {
                    protocol: _input.config.protocol,
                    ip: _input.config.ip,
                    port: _input.config.port,
                };
                margin = _input.config.margin;
            }

            let analysis = await GetAnalysis(config, margin, _input.imageBase64);

            return analysis.map((value, index, array) => {
                return {
                    age: value.age,
                    gender: value.gender,
                    imageBase64: Parser.Base64Str2HtmlSrc(value.buffer.toString(Parser.Encoding.base64)),
                };
            });
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
