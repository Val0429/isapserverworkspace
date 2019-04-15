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
type InputR = IRequest.IParking.IAll;

type OutputR = IResponse.IParking.IAll[];

action.get(
    {
        inputType: 'InputR',
        permission: [RoleList.Chairman, RoleList.DeputyChairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral, RoleList.Guard],
    },
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;
            let _userInfo = await Db.GetUserInfo(data);

            let query: Parse.Query<IDB.Parking> = new Parse.Query(IDB.Parking).equalTo('community', _userInfo.community).equalTo('isDeleted', false);

            if (_input.status === 'used') {
                query.notEqualTo('resident', undefined);
            } else if (_input.status === 'unused') {
                query.equalTo('resident', undefined);
            }

            let total: number = await query.count().fail((e) => {
                throw e;
            });

            let parkings: IDB.Parking[] = await query
                .limit(total)
                .find()
                .fail((e) => {
                    throw e;
                });

            return parkings.map((value, index, array) => {
                return {
                    parkingId: value.id,
                    parkingName: value.getValue('name'),
                    cost: value.getValue('cost'),
                };
            });
        } catch (e) {
            Print.Log(new Error(JSON.stringify(e)), 'error');
            throw e;
        }
    },
);
