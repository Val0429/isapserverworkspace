import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, Vote, CharacterCommittee, CharacterResident, CharacterResidentInfo } from '../../custom/models';
import {} from '../../custom/helpers';
import * as Enum from '../../custom/enums';
import * as Notice from '../../custom/services/notice';
import { CheckResident } from '../user/resident/info';

let action = new Action({
    loginRequired: true,
});

export default action;

/**
 * Action update
 */
type InputU = IRequest.IVote.IVoting;

type OutputU = Date;

action.put(
    {
        inputType: 'InputU',
        permission: [RoleList.SystemAdministrator, RoleList.Administrator, RoleList.Resident],
    },
    async (data): Promise<OutputU> => {
        let _input: InputU = data.inputType;

        let query: Parse.Query<Vote> = new Parse.Query(Vote);

        let residentInfo: CharacterResidentInfo = await CheckResident(data);
        if (residentInfo) {
            query.containedIn('aims', [residentInfo.getValue('character')]);
        }

        let vote: Vote = await query.get(_input.voteId).catch((e) => {
            throw e;
        });
        if (!vote) {
            throw Errors.throw(Errors.CustomBadRequest, ['vote not found']);
        }

        let options: string[] = vote.getValue('options').map((value, index, array) => {
            return value.option;
        });
        if (options.indexOf(_input.option) < 0) {
            throw Errors.throw(Errors.CustomBadRequest, ['option not found']);
        }

        let residentIds: string[] = [].concat(
            ...vote.getValue('options').map((value, index, array) => {
                return value.residents.map((value1, index1, array1) => {
                    return value1.id;
                });
            }),
        );
        if (residentIds.indexOf(residentInfo.getValue('resident').id) > -1) {
            throw Errors.throw(Errors.CustomBadRequest, ['voted']);
        }

        vote.setValue(
            'options',
            vote.getValue('options').map((value, index, array) => {
                if (value.option === _input.option) {
                    value.residents.push(residentInfo.getValue('resident'));
                }
                return value;
            }),
        );

        await vote.save(null, { useMasterKey: true }).catch((e) => {
            throw e;
        });

        return new Date();
    },
);
