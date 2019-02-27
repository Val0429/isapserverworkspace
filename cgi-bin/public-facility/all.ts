import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, PublicFacility } from '../../custom/models';

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
        permission: [RoleList.SystemAdministrator, RoleList.Administrator, RoleList.Chairman, RoleList.DeputyChairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral, RoleList.Guard],
    },
    async (data): Promise<OutputR> => {
        let _input: InputR = data.inputType;

        let query: Parse.Query<PublicFacility> = new Parse.Query(PublicFacility);

        let total: number = await query.count().catch((e) => {
            throw e;
        });

        let facilitys: PublicFacility[] = await query
            .limit(total)
            .find()
            .catch((e) => {
                throw e;
            });

        return facilitys.map((value, index, array) => {
            return {
                publicFacilityId: value.id,
                name: value.getValue('name'),
                pointCost: value.getValue('pointCost'),
            };
        });
    },
);
