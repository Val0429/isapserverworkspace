import { IUser, Action, Restful, RoleList, Errors, Socket, Config } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, Db, FRSService } from '../../../custom/helpers';
import * as Enum from '../../../custom/enums';
import { GetDeviceList } from './';

let action = new Action({
    loginRequired: true,
    permission: [RoleList.SuperAdministrator, RoleList.Admin],
});

export default action;

/**
 * Action Create
 */
type InputC = IRequest.IPartner.IFRSDevice;

type OutputC = FRSService.IDevice[];

action.post(
    {
        inputType: 'InputC',
    },
    async (data): Promise<OutputC> => {
        try {
            let _input: InputC = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);

            let analysis: FRSService.IAnalysisConfig = undefined;
            let manage: FRSService.IManageCinfig = undefined;
            if (_input.objectId) {
                let server: IDB.ServerFRS = await new Parse.Query(IDB.ServerFRS)
                    .equalTo('objectId', _input.objectId)
                    .first()
                    .fail((e) => {
                        throw e;
                    });
                if (!server) {
                    throw Errors.throw(Errors.CustomBadRequest, ['server not found']);
                }

                analysis = server.getValue('analysis');
                manage = server.getValue('manage');
            } else if (_input.config) {
                analysis = _input.config.analysis;
                manage = _input.config.manage;
            } else {
                throw Errors.throw(Errors.CustomBadRequest, ['need objectId or config']);
            }

            let devices = await GetDeviceList(analysis, manage);

            return devices;
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
