import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../custom/models';
import { Db, Print } from '../../custom/helpers';

let action = new Action({
    loginRequired: true,
});

export default action;

/**
 * Action Read
 */
type InputR = null;

type OutputR = IResponse.IPublicFacility.IAll[];

action.get(
    {
        permission: [RoleList.Chairman, RoleList.DeputyChairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral, RoleList.Guard],
    },
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;
            let _userInfo = await Db.GetUserInfo(data);

            let query: Parse.Query<IDB.PublicFacility> = new Parse.Query(IDB.PublicFacility).equalTo('community', _userInfo.community).equalTo('isDeleted', false);

            let total: number = await query.count().fail((e) => {
                throw e;
            });

            let facilitys: IDB.PublicFacility[] = await query
                .limit(total)
                .find()
                .fail((e) => {
                    throw e;
                });

            return facilitys.map((value, index, array) => {
                return {
                    publicFacilityId: value.id,
                    name: value.getValue('name'),
                    pointCost: value.getValue('pointCost'),
                };
            });
        } catch (e) {
            Print.Log(new Error(JSON.stringify(e)), 'error');
            throw e;
        }
    },
);
