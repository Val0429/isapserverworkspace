import { IUser, Action, Restful, RoleList, Errors, Socket } from 'core/cgi-package';
import { default as Ast } from 'services/ast-services/ast-client';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, Parser, Db } from '../../../custom/helpers';
import * as Middleware from '../../../custom/middlewares';
import * as Enum from '../../../custom/enums';

let action = new Action({
    loginRequired: true,
    permission: [RoleList.SuperAdministrator, RoleList.Admin, RoleList.User],
});

export default action;

/**
 * Action Read
 */
type InputR = null;

type OutputR = IResponse.IReport.ICampaignCondition;

action.get(
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);

            let query: Parse.Query<IDB.EventCampaign> = new Parse.Query(IDB.EventCampaign).containedIn('sites', _userInfo.sites);

            let total: number = await query.count().fail((e) => {
                throw e;
            });

            let campaigns: IDB.EventCampaign[] = await query
                .limit(total)
                .include('sites')
                .find()
                .fail((e) => {
                    throw e;
                });

            let response: IResponse.IReport.ICampaignCondition = {};

            campaigns = campaigns.sort((a, b) => {
                if (a.getValue('year') === b.getValue('year')) {
                    return a.getValue('startDate').getTime() - b.getValue('startDate').getTime();
                }

                return a.getValue('year') - b.getValue('year');
            });

            campaigns.forEach((value, index, array) => {
                let key: string = value.getValue('year').toString();

                if (!response[key]) {
                    response[key] = [];
                }

                let sites = value
                    .getValue('sites')
                    .filter((value1, index1, array1) => {
                        return _userInfo.siteIds.indexOf(value1.id) > -1;
                    })
                    .map<IResponse.IObject>((value1, index1, array1) => {
                        return {
                            objectId: value1.id,
                            name: value1.getValue('name'),
                        };
                    });

                response[key].push({
                    objectId: value.id,
                    name: value.getValue('name'),
                    sites: sites,
                });
            });

            return response;
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
