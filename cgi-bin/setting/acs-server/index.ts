import { IUser, Action, Restful, RoleList, Errors, Socket } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, Db, EntryPass, Utility } from '../../../custom/helpers';
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

type OutputR = IResponse.ISetting.IACSServerR;

action.get(
    {
        permission: [RoleList.SystemAdministrator, RoleList.Administrator],
    },
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);

            let setting = DataCenter.acsServerSetting$.value;

            return setting;
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);

/**
 * Action update
 */
type InputU = IRequest.ISetting.IACSServerU;

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
                await ACSServerService.Check({
                    ip: _input.ip,
                    port: _input.port,
                    serviceId: _input.serviceId,
                });
            } catch (e) {
                throw Errors.throw(Errors.CustomBadRequest, [`acs server: ${e}`]);
            }

            DataCenter.acsServerSetting$.next({
                ip: _input.ip,
                port: _input.port,
                serviceId: _input.serviceId,
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
namespace ACSServerService {
    /**
     * Check
     * @param config
     */
    export async function Check(config: { ip: string; port: number; serviceId: string }): Promise<void> {
        try {
            let worker = EntryPass.CreateInstance(config.ip, config.port, config.serviceId);
            if (worker) {
                let name: string = Utility.RandomText(10, { symbol: false });
                let serialNumber: string = `${name}_${Utility.RandomText(10, { symbol: false, EN: false, en: false })}`;

                let staffInfo: EntryPass.EntryPassStaffInfo = {
                    name: name,
                    serialNumber: serialNumber,
                };

                let ret: EntryPass.OperationReuslt = await worker.AddStaff(staffInfo);
                if (!ret.result) {
                    throw ret.errorMessage;
                }

                ret = await worker.DeleteStaff(staffInfo);
                if (!ret.result) {
                    throw ret.errorMessage;
                }
            }
        } catch (e) {
            throw e;
        }
    }
}
