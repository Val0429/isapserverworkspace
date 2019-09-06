import { IUser, Action, Restful, RoleList, Errors, Socket } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, File, Db, Sgsms } from '../../../custom/helpers';
import * as Enum from '../../../custom/enums';
import { default as DataCenter } from '../../../custom/services/data-center';

let action = new Action({
    loginRequired: true,
});

export default action;

/**
 * Action Read
 */
type InputR = null;

type OutputR = IResponse.ISetting.ISgsmsR;

action.get(
    {
        permission: [RoleList.Administrator],
    },
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);

            let setting = DataCenter.textMessageSetting$.value;

            return {
                enable: setting.enable,
                url: setting.sgsms.url,
                account: setting.sgsms.account,
                password: setting.sgsms.password,
            };
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);

/**
 * Action update
 */
type InputU = IRequest.ISetting.ISgsmsU;

type OutputU = Date;

action.put(
    {
        inputType: 'InputU',
        permission: [RoleList.Administrator],
    },
    async (data): Promise<OutputU> => {
        try {
            let _input: InputU = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);

            let sgsms: Sgsms = new Sgsms();
            sgsms.config = {
                url: _input.url,
                account: _input.account,
                password: _input.password,
            };

            try {
                sgsms.Initialization();
            } catch (e) {
                throw Errors.throw(Errors.CustomBadRequest, [e]);
            }

            DataCenter.textMessageSetting$.next({
                enable: _input.enable,
                sgsms: {
                    url: _input.url,
                    account: _input.account,
                    password: _input.password,
                },
            });

            return new Date();
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
