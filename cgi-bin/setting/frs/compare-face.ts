import { IUser, Action, Restful, RoleList, Errors, Socket } from 'core/cgi-package';
import { default as Ast } from 'services/ast-services/ast-client';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, FRS, Db, File } from '../../../custom/helpers';
import * as Middleware from '../../../custom/middlewares';
import * as Enum from '../../../custom/enums';
import { default as DataCenter } from '../../../custom/services/data-center';
import { FRSService } from './';

let action = new Action({
    loginRequired: true,
});

export default action;

/**
 * Action Create
 */
type InputC = IRequest.ISetting.IFRSCompareFace;

type OutputC = IResponse.ISetting.IFRSCompareFace;

action.post(
    {
        inputType: 'InputC',
        permission: [RoleList.SystemAdministrator, RoleList.Administrator, RoleList.VMS],
    },
    async (data): Promise<OutputC> => {
        try {
            let _input: InputC = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);

            let config: FRS.IConfig = undefined;
            if (!!_input.config) {
                config = {
                    protocol: _input.config.protocol,
                    ip: _input.config.ip,
                    port: _input.config.port,
                    wsport: _input.config.port,
                    account: _input.config.account,
                    password: _input.config.password,
                };
            } else {
                let setting = DataCenter.frsSetting$.value;

                config = {
                    protocol: setting.protocol,
                    ip: setting.ip,
                    port: setting.port,
                    wsport: setting.port,
                    account: setting.account,
                    password: setting.password,
                };
            }

            try {
                let frs = await FRSService.Login(config);

                let buffer1: Buffer = Buffer.from(File.GetBase64Data(_input.image1Base64), Enum.EEncoding.base64);
                let buffer2: Buffer = Buffer.from(File.GetBase64Data(_input.image2Base64), Enum.EEncoding.base64);
                let score = await frs.CompareFace(buffer1, buffer2);

                return {
                    message: 'ok',
                    score: score,
                };
            } catch (e) {
                throw Errors.throw(Errors.CustomBadRequest, [`frs: ${e}`]);
            }
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
