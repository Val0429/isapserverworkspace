import { IUser, Action, Restful, RoleList, Errors, Socket, Config } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, Db, Parser, File, Draw, HumanDetection } from '../../../custom/helpers';
import * as Enum from '../../../custom/enums';

let action = new Action({
    loginRequired: true,
    permission: [RoleList.SuperAdministrator, RoleList.Admin],
});

export default action;

/**
 * Action Create
 */
type InputC = IRequest.ISetting.IHumanDetectionTest;

type OutputC = IResponse.ISetting.IHumanDetectionTest;

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

            let hd: HumanDetection.ISap = new HumanDetection.ISap();
            hd.config = {
                protocol: Config.humanDetection.protocol,
                ip: Config.humanDetection.ip,
                port: Config.humanDetection.port,
            };

            hd.Initialization();

            let regex = /data:.*;base64, */;

            let buffer: Buffer = Buffer.from(_input.imageBase64.replace(regex, ''), Parser.Encoding.base64);
            let locations = await hd.GetAnalysis(buffer);

            if (locations.length > 0) {
                let config = Config.humanDetection.output;

                let rects: Draw.IRect[] = locations.map((value, index, array) => {
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

                buffer = await Draw.Rectangle(rects, buffer);
                buffer = await Draw.Resize(buffer, { width: config.image.width, height: config.image.height }, config.image.isFill, config.image.isTransparent);
            }

            return {
                imageBase64: Parser.Base64Str2HtmlSrc(buffer.toString(Parser.Encoding.base64)),
            };
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
