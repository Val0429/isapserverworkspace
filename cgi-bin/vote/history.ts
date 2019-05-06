import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../custom/models';
import { Db, Print } from '../../custom/helpers';
import * as Enum from '../../custom/enums';
import Notice from '../../custom/actions/notice';

let action = new Action({
    loginRequired: true,
});

export default action;

/**
 * Action Read
 */
type InputR = IRequest.IDataList;

type OutputR = IResponse.IDataList<IResponse.IVote.IHistory[]>;

action.get(
    {
        inputType: 'InputR',
        permission: [RoleList.Resident],
    },
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;
            let _userInfo = await Db.GetUserInfo(data);
            let _page: number = _input.page || 1;
            let _count: number = _input.count || 10;

            let query: Parse.Query<IDB.Vote> = new Parse.Query(IDB.Vote).equalTo('community', _userInfo.community).equalTo('isDeleted', false);

            if (_userInfo.residentInfo) {
                query.containedIn('aims', [_userInfo.residentInfo.getValue('character')]);
            }

            let total: number = await query.count().fail((e) => {
                throw e;
            });

            let votes: IDB.Vote[] = await query
                .skip((_page - 1) * _count)
                .limit(_count)
                .find()
                .fail((e) => {
                    throw e;
                });

            let tasks: Promise<any>[] = votes.map<any>((value, index, array) => {
                return new Parse.Query(IDB.CharacterCommittee).equalTo('user', value.getValue('creator')).first();
            });
            let committees: IDB.CharacterCommittee[] = await Promise.all(tasks).catch((e) => {
                throw e;
            });

            return {
                total: total,
                page: _page,
                count: _count,
                content: votes.map((value, index, array) => {
                    let option = value.getValue('options').find((value1, index1, array1) => {
                        let residents: string[] = value1.residents.map((value2, index2, array2) => {
                            return value2.id;
                        });
                        return residents.indexOf(_userInfo.resident.id) > -1;
                    });

                    return {
                        voteId: value.id,
                        date: value.getValue('date'),
                        deadline: value.getValue('deadline'),
                        title: value.getValue('title'),
                        content: value.getValue('content'),
                        options: value.getValue('options').map((value1, index1, array1) => {
                            return value1.option;
                        }),
                        status: value.getValue('status'),
                        sponsorName: committees[index] ? committees[index].getValue('name') : '',
                        aims: value.getValue('aims'),
                        option: option ? option.option : '',
                    };
                }),
            };
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
