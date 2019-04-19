import { IUser, Action, Restful, RoleList, Errors, Socket, Config } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, Regex, Parser, File, Draw, HumanDetection } from '../../../custom/helpers';
import * as Enum from '../../../custom/enums';

let action = new Action({
    loginRequired: true,
    permission: [RoleList.Admin],
});

export default action;

/**
 * Action Create
 */
type InputC = IRequest.ISetting.IHumanDetectionCheck;

type OutputC = string;

action.post(
    {
        inputType: 'InputC',
        postSizeLimit: 10000000,
    },
    async (data): Promise<OutputC> => {
        try {
            let _input: InputC = data.inputType;

            if (!Regex.IsIp(_input.ip)) {
                throw Errors.throw(Errors.CustomBadRequest, ['ip error']);
            }
            if (!Regex.IsPort(_input.port.toString())) {
                throw Errors.throw(Errors.CustomBadRequest, ['port error']);
            }

            let extension: string = File.GetExtension(_input.imageBase64);
            if (!extension) {
                throw Errors.throw(Errors.CustomBadRequest, ['media type error']);
            }

            let hd: HumanDetection.ISap = new HumanDetection.ISap();
            hd.config = {
                protocol: _input.protocol,
                ip: _input.ip,
                port: _input.port,
            };

            hd.Initialization();

            let regex = /data:.*;base64, */;

            let buffer: Buffer = Buffer.from(_input.imageBase64.replace(regex, ''), Parser.Encoding.base64);
            let locations = await hd.GetAnalysis(buffer);

            if (locations.length > 0) {
                let rects: Draw.IRect[] = locations.map((value, index, array) => {
                    return {
                        x: value.x,
                        y: value.y,
                        width: value.width,
                        height: value.height,
                        color: 'red',
                        lineWidth: 7,
                        isFill: false,
                    };
                });

                buffer = await Draw.Rectangle(rects, buffer);
                buffer = await Draw.Resize(buffer, { width: Config.humanDetection.output.width, height: Config.humanDetection.output.height }, Config.humanDetection.output.quality);
            }

            return Parser.Base64Str2HtmlSrc(buffer.toString(Parser.Encoding.base64));
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
