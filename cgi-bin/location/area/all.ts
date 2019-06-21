import { IUser, Action, Restful, RoleList, Errors, Socket, Config } from 'core/cgi-package';
import { default as Ast } from 'services/ast-services/ast-client';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, File, Parser, Db } from '../../../custom/helpers';
import * as Middleware from '../../../custom/middlewares';
import * as Enum from '../../../custom/enums';

let action = new Action({
    loginRequired: true,
    permission: [RoleList.Admin],
});

export default action;

type MultiData = IRequest.IMultiData;

/**
 * Action Read
 */
type InputR = IRequest.ILocation.IAreaAll;

type OutputR = IResponse.ILocation.IAreaAll[];

action.get(
    {
        inputType: 'InputR',
    },
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);

            let query: Parse.Query<IDB.LocationArea> = new Parse.Query(IDB.LocationArea);

            if (_input.siteId) {
                let site: IDB.LocationSite = new IDB.LocationSite();
                site.id = _input.siteId;

                query.equalTo('site', site);
            }

            let total: number = await query.count().fail((e) => {
                throw e;
            });

            let areas: IDB.LocationArea[] = await query
                .limit(total)
                .include('site')
                .find()
                .fail((e) => {
                    throw e;
                });

            return areas.map((value, index, array) => {
                let site: IResponse.IObject = {
                    objectId: value.getValue('site').id,
                    name: value.getValue('site').getValue('name'),
                };

                return {
                    objectId: value.id,
                    site: site,
                    name: value.getValue('name'),
                };
            });
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
