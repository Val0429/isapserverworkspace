import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Db, Print } from '../../../custom/helpers';

let action = new Action({
    loginRequired: true,
});

export default action;

/**
 * Action Read
 */
type InputR = null;

type OutputR = IResponse.IUser.IResidentAll[];

action.get(
    {
        permission: [RoleList.Chairman, RoleList.DeputyChairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral, RoleList.Guard],
    },
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;
            let _userInfo = await Db.GetUserInfo(data);
            let query: Parse.Query<IDB.CharacterResident> = new Parse.Query(IDB.CharacterResident).equalTo('community', _userInfo.community);

            let total: number = await query.count().fail((e) => {
                throw e;
            });

            let articles: IDB.CharacterResident[] = await query
                .limit(total)
                .find()
                .fail((e) => {
                    throw e;
                });

            return articles.map((value, index, array) => {
                return {
                    redsidentId: value.id,
                    address: value.getValue('address'),
                    barcode: value.getValue('barcode'),
                };
            });
        } catch (e) {
            Print.Log(new Error(JSON.stringify(e)), 'error');
            throw e;
        }
    },
);
