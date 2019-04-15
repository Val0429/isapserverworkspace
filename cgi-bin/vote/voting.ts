import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../custom/models';
import { Db, Print } from '../../custom/helpers';
import * as Enum from '../../custom/enums';
import * as Notice from '../../custom/services/notice';

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
        permission: [RoleList.Resident],
    },
    async (data): Promise<OutputU> => {
        try {
            let _input: InputU = data.inputType;
            let _userInfo = await Db.GetUserInfo(data);

            let query: Parse.Query<IDB.Vote> = new Parse.Query(IDB.Vote);

            if (_userInfo.residentInfo) {
                query.containedIn('aims', [_userInfo.residentInfo.getValue('character')]);
            }

            let vote: IDB.Vote = await query.get(_input.voteId).fail((e) => {
                throw e;
            });
            if (!vote) {
                throw Errors.throw(Errors.CustomBadRequest, ['vote not found']);
            }
            if (vote.getValue('isDeleted')) {
                throw Errors.throw(Errors.CustomBadRequest, ['vote was deleted']);
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
            if (residentIds.indexOf(_userInfo.resident.id) > -1) {
                throw Errors.throw(Errors.CustomBadRequest, ['voted']);
            }

            vote.setValue(
                'options',
                vote.getValue('options').map((value, index, array) => {
                    if (value.option === _input.option) {
                        value.residents.push(_userInfo.resident);
                    }
                    return value;
                }),
            );

            await vote.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });

            return new Date();
        } catch (e) {
            Print.Log(new Error(JSON.stringify(e)), 'error');
            throw e;
        }
    },
);
