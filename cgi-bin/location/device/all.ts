import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { File, Regex } from '../../../custom/helpers';
import * as Enum from '../../../custom/enums';

let action = new Action({
    loginRequired: true,
    permission: [RoleList.Admin],
});

export default action;

/**
 * Action Read
 */
type InputR = IRequest.ILocation.IDeviceIndexR;

type OutputR = IResponse.ILocation.IDeviceAll[];

action.get(
    { inputType: 'InputR' },
    async (data): Promise<OutputR> => {
        let _input: InputR = data.inputType;

        let query: Parse.Query<IDB.LocationDevice> = new Parse.Query(IDB.LocationDevice).equalTo('isDeleted', false);

        if (_input.siteId) {
            let site: IDB.LocationSite = new IDB.LocationSite();
            site.id = _input.siteId;

            query = query.equalTo('site', site);
        }

        let total: number = await query.count().fail((e) => {
            throw e;
        });

        let devices: IDB.LocationDevice[] = await query
            .limit(total)
            .find()
            .fail((e) => {
                throw e;
            });

        return devices.map((value, index, array) => {
            return {
                siteId: value.getValue('site').id,
                deviceId: value.id,
                name: value.getValue('name'),
            };
        });
    },
);
