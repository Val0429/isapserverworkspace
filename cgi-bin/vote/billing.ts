import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, Vote, CharacterCommittee } from '../../custom/models';
import {} from '../../custom/helpers';
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
        permission: [RoleList.SystemAdministrator, RoleList.Administrator, RoleList.Chairman, RoleList.DeputyChairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral, RoleList.Guard, RoleList.Resident],
    },
    async (data): Promise<OutputR> => {
        let _input: InputR = data.inputType;

        let vote: Vote = await new Parse.Query(Vote).get(_input.voteId).catch((e) => {
            throw e;
        });
        if (!vote) {
            throw Errors.throw(Errors.CustomBadRequest, ['vote not found']);
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
    },
);
