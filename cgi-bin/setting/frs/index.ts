import { IUser, Action, Restful, RoleList, Errors, Socket } from 'core/cgi-package';
import { default as Ast } from 'services/ast-services/ast-client';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, Utility, Db, FRS } from '../../../custom/helpers';
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

type OutputR = IResponse.ISetting.IFRSR;

action.get(
    {
        permission: [RoleList.SystemAdministrator, RoleList.Administrator],
    },
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);

            let setting = DataCenter.frsSetting$.value;

            return {
                protocol: setting.protocol,
                ip: setting.ip,
                port: setting.port,
                account: setting.account,
                password: setting.password,
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
type InputU = IRequest.ISetting.IFRSU;

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

            try {
                await FRSService.Login({
                    protocol: _input.protocol,
                    ip: _input.ip,
                    port: _input.port,
                    wsport: _input.port,
                    account: _input.account,
                    password: _input.password,
                });
            } catch (e) {
                throw Errors.throw(Errors.CustomBadRequest, [`frs: ${e}`]);
            }

            DataCenter.frsSetting$.next({
                protocol: _input.protocol,
                ip: _input.ip,
                port: _input.port,
                account: _input.account,
                password: _input.password,
            });

            return new Date();
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);

/**
 *
 */
namespace FRSService {
    /**
     * Login
     * @param config
     */
    export async function Login(config: FRS.IConfig): Promise<FRS> {
        try {
            let frs: FRS = new FRS();
            frs.config = config;

            frs.Initialization();

            await frs.Login();

            return frs;
        } catch (e) {
            throw e;
        }
    }
}
