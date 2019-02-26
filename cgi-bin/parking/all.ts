import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, Parking } from '../../custom/models';

let action = new Action({
    loginRequired: true,
    permission: [RoleList.SystemAdministrator, RoleList.Administrator, RoleList.Chairman, RoleList.DeputyChairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral, RoleList.Guard],
});

export default action;

/**
 * Action Read
 */
type InputR = IRequest.IParking.IAll;

type OutputR = IResponse.IParking.IAll[];

action.get(
    {
        inputType: 'InputR',
        permission: [RoleList.SystemAdministrator, RoleList.Administrator, RoleList.Chairman, RoleList.DeputyChairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral, RoleList.Guard],
    },
    async (data): Promise<OutputR> => {
        let _input: InputR = data.inputType;

        let query: Parse.Query<Parking> = new Parse.Query(Parking);

        if (_input.status === 'used') {
            query.notEqualTo('resident', undefined);
        } else if (_input.status === 'unused') {
            query.equalTo('resident', undefined);
        }

        let total: number = await query.count().catch((e) => {
            throw e;
        });

        let parkings: Parking[] = await query
            .limit(total)
            .find()
            .catch((e) => {
                throw e;
            });

        return parkings.map((value, index, array) => {
            return {
                parkingId: value.id,
                parkingName: value.getValue('name'),
                cost: value.getValue('cost'),
            };
        });
    },
);
