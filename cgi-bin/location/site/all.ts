import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { File, Regex, Print } from '../../../custom/helpers';
import * as Enum from '../../../custom/enums';

let action = new Action({
    loginRequired: true,
    permission: [RoleList.Admin],
});

export default action;

/**
 * Action Read
 */
type InputR = IRequest.ILocation.ISiteIndexR;

type OutputR = IResponse.ILocation.ISiteAll[];

action.get(
    { inputType: 'InputR' },
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;

            let query: Parse.Query<IDB.LocationSite> = new Parse.Query(IDB.LocationSite).equalTo('isDeleted', false);

            if (_input.regionId) {
                let region: IDB.LocationRegion = new IDB.LocationRegion();
                region.id = _input.regionId;

                query = query.equalTo('region', region);
            }

            let total: number = await query.count().fail((e) => {
                throw e;
            });

            let sites: IDB.LocationSite[] = await query
                .limit(total)
                .find()
                .fail((e) => {
                    throw e;
                });

            return sites.map((value, index, array) => {
                return {
                    regionId: value.getValue('region').id,
                    siteId: value.id,
                    name: value.getValue('name'),
                };
            });
        } catch (e) {
            Print.Log(new Error(JSON.stringify(e)), 'error');
            throw e;
        }
    },
);
