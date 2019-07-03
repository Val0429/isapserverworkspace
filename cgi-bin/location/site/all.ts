import { IUser, Action, Restful, RoleList, Errors, Socket, Config } from 'core/cgi-package';
import { default as Ast } from 'services/ast-services/ast-client';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, File, Parser, Db, Draw } from '../../../custom/helpers';
import * as Middleware from '../../../custom/middlewares';
import * as Enum from '../../../custom/enums';
import { LocationRegion } from 'workspace/custom/models/db/location-region';

let action = new Action({
    loginRequired: true,
    permission: [RoleList.Admin, RoleList.SuperAdministrator, RoleList.SystemAdministrator]
});

export default action;

type MultiData = IRequest.IMultiData;

/**
 * Action Read
 */
type InputR = IRequest.ILocation.ISiteAll;

type OutputR = IResponse.ILocation.ISiteAll[];

action.get(
    {
        inputType: 'InputR',
    },
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;
            // let _userInfo = await Db.GetUserInfo(data.request, data.user);

            let query: Parse.Query<IDB.LocationSite> = new Parse.Query(IDB.LocationSite);

            if (_input.type === 'binding') {
                query.notEqualTo('region', null);

                if (_input.regionId) {
                    let region: IDB.LocationRegion = new IDB.LocationRegion();
                    region.id = _input.regionId;

                    query.equalTo('region', region);
                }
            } else if (_input.type === 'unbinding') {
                query.equalTo('region', null);
            }

            let filter = data.parameters;
            console.log(filter)
            if(filter.sitename){
                query.matches('name', new RegExp(filter.sitename), 'i');
            }
            
            if(filter.regionname){
                
                let regQuery = new Parse.Query(LocationRegion).matches('name', new RegExp(filter.regionname), 'i');
                query.matchesQuery('region', regQuery);
            }

            let total: number = await query.count().fail((e) => {
                throw e;
            });
            
            let sites: IDB.LocationSite[] = await query
                .limit(total)
                .include('region')
                .find()
                .fail((e) => {
                    throw e;
                });

            return sites.map((value, index, array) => {
                let region: IResponse.IObject = value.getValue('region')
                    ? {
                          objectId: value.getValue('region').id,
                          name: value.getValue('region').getValue('name'),
                      }
                    : undefined;

                return {
                    objectId: value.id,
                    region: region,
                    name: value.getValue('name'),
                };
            });
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
