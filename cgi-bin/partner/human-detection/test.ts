import { IUser, Action, Restful, RoleList, Errors, Socket, Config } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, Db, Parser, File, Draw, HumanDetection } from '../../../custom/helpers';
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
type InputC = IRequest.IPartner.IHumanDetectionTest;

type OutputC = IResponse.IPartner.IHumanDetectionTest;

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

            let config: IDB.IServerHumanDetection = undefined;
            if (_input.objectId) {
                let server: IDB.ServerHumanDetection = await new Parse.Query(IDB.ServerHumanDetection)
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
                    target_score: server.getValue('target_score'),
                };
            } else if (_input.config) {
                config = {
                    name: '',
                    protocol: _input.config.protocol,
                    ip: _input.config.ip,
                    port: _input.config.port,
                    target_score: _input.config.target_score,
                };
            } else {
                throw Errors.throw(Errors.CustomBadRequest, ['need objectId or config']);
            }

            let analysis = await GetAnalysis(config, _input.imageBase64);

            if (analysis.locations.length > 0) {
                let config = Config.humanDetection.output;

                let rects: Draw.IRect[] = analysis.locations.map((value, index, array) => {
                    return {
                        x: value.x,
                        y: value.y,
                        width: value.width,
                        height: value.height,
                        color: config.rectangle.color,
                        lineWidth: config.rectangle.lineWidth,
                        isFill: config.rectangle.isFill,
                    };
                });

                analysis.buffer = await Draw.Rectangle(rects, analysis.buffer);
                analysis.buffer = await Draw.Resize(analysis.buffer, { width: config.image.width, height: config.image.height }, config.image.isFill, config.image.isTransparent);
            }

            return {
                imageBase64: Parser.Base64Str2HtmlSrc(analysis.buffer.toString(Parser.Encoding.base64)),
            };
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
