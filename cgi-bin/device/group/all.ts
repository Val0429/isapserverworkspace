import { IUser, Action, Restful, RoleList, Errors, Socket, Config } from 'core/cgi-package';
import { default as Ast } from 'services/ast-services/ast-client';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, File, Parser, Db, Draw } from '../../../custom/helpers';
import * as Middleware from '../../../custom/middlewares';
import * as Enum from '../../../custom/enums';

let action = new Action({
    loginRequired: true,
});

export default action;

type MultiData = IRequest.IMultiData;

/**
 * Action Read
 */
type InputR = IRequest.IDevice.IGroupAll;

type OutputR = IResponse.IDevice.IGroupAll[];

action.get(
    {
        inputType: 'InputR',
        permission: [RoleList.SuperAdministrator, RoleList.Admin, RoleList.User],
    },
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);

            let query: Parse.Query<IDB.DeviceGroup> = new Parse.Query(IDB.DeviceGroup);

            if (_input.siteId) {
                let site: IDB.LocationSite = new IDB.LocationSite();
                site.id = _input.siteId;

                query.equalTo('site', site);
            }
            if (_input.areaId) {
                let area: IDB.LocationArea = new IDB.LocationArea();
                area.id = _input.areaId;

                query.equalTo('area', area);
            }
            if (_input.mode) {
                query.equalTo('mode', _input.mode);
            }

            let total: number = await query.count().fail((e) => {
                throw e;
            });

            let group: IDB.DeviceGroup[] = await query
                .limit(total)
                .find()
                .fail((e) => {
                    throw e;
                });

            return group.map((value, index, array) => {
                return {
                    objectId: value.id,
                    mode: Enum.EDeviceMode[value.getValue('mode')],
                    name: value.getValue('name'),
                };
            });
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
