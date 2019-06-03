import { IUser, Action, Restful, RoleList, Errors, Socket, Config } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, Db, Parser, File, Draw } from '../../../custom/helpers';
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
type InputC = IRequest.IPartner.IDemographicTest;

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

            let config: IDB.IServerDemographic = undefined;
            if (_input.objectId) {
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
                    name: '',
                    protocol: server.getValue('protocol'),
                    ip: server.getValue('ip'),
                    port: server.getValue('port'),
                    margin: server.getValue('margin'),
                };
            } else if (_input.config) {
                config = {
                    name: '',
                    protocol: _input.config.protocol,
                    ip: _input.config.ip,
                    port: _input.config.port,
                    margin: _input.config.margin,
                };
            } else {
                throw Errors.throw(Errors.CustomBadRequest, ['need objectId or config']);
            }

            let analysis = await GetAnalysis(config, _input.imageBase64);

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
