import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../custom/models';
import { Db, Print } from '../../custom/helpers';
import * as Enum from '../../custom/enums';

let action = new Action({
    loginRequired: true,
});

export default action;

/**
 * Action Read
 */
type InputR = IRequest.IVote.IBilling;

type OutputR = IResponse.IVote.IBilling;

action.get(
    {
        inputType: 'InputR',
        permission: [RoleList.Chairman, RoleList.DeputyChairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral, RoleList.Guard, RoleList.Resident],
    },
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;
            let _userInfo = await Db.GetUserInfo(data);

            let vote: IDB.Vote = await new Parse.Query(IDB.Vote).get(_input.voteId).fail((e) => {
                throw e;
            });
            if (!vote) {
                throw Errors.throw(Errors.CustomBadRequest, ['vote not found']);
            }
            if (vote.getValue('isDeleted')) {
                throw Errors.throw(Errors.CustomBadRequest, ['vote was deleted']);
            }

            return {
                total: vote.getValue('options').reduce((prev, curr, index, array) => {
                    return prev + curr.residents.length;
                }, 0),
                options: vote.getValue('options').map((value, index, array) => {
                    return {
                        option: value.option,
                        count: value.residents.length,
                    };
                }),
            };
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
