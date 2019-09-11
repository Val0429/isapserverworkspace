import { IUser, Action, Restful, RoleList, Errors, Socket } from 'core/cgi-package';
import { default as Ast } from 'services/ast-services/ast-client';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, Utility, Db, Suntec } from '../../../custom/helpers';
import * as Middleware from '../../../custom/middlewares';
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

type OutputR = IResponse.ISetting.ISuntecAppR;

action.get(
    {
        permission: [RoleList.SystemAdministrator, RoleList.Administrator],
    },
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);

            let setting = DataCenter.suntecAppSetting$.value;

            return {
                host: setting.host,
                token: setting.token,
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
type InputU = IRequest.ISetting.ISuntecAppU;

type OutputU = Date;

action.put(
    {
        inputType: 'InputU',
        permission: [RoleList.SystemAdministrator, RoleList.Administrator],
    },
    async (data): Promise<OutputU> => {
        try {
            let _input: InputU = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);

            await Check({
                host: _input.host,
                token: _input.token,
            });

            DataCenter.suntecAppSetting$.next({
                host: _input.host,
                token: _input.token,
            });

            return new Date();
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);

/**
 * Check
 * @param config
 */
export async function Check(config: { host: string; token: string }): Promise<void> {
    try {
        let suntec = Suntec.Suntec.getInstance();
        suntec.setConnection({
            protocal: 'https',
            host: config.host,
            token: config.token,
        });

        try {
            await suntec.revoke({
                AccessId: '9876432101',
            });
        } catch (e) {
            if (e !== 'AccessId is not exist') {
                throw e;
            }
        }
    } catch (e) {
        throw Errors.throw(Errors.CustomBadRequest, [e]);
    }
}
