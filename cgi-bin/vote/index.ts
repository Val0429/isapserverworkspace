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
 * Action Create
 */
type InputC = IRequest.IVote.IIndexC;

type OutputC = IResponse.IVote.IIndexC;

action.post(
    {
        inputType: 'InputC',
        permission: [RoleList.Chairman, RoleList.DeputyChairman, RoleList.DirectorGeneral],
    },
    async (data): Promise<OutputC> => {
        try {
            let _input: InputC = data.inputType;
            let _userInfo = await Db.GetUserInfo(data);

            let _option: string = _input.options.find((value, index, array) => {
                return array.lastIndexOf(value) !== index;
            });
            if (_option) {
                throw Errors.throw(Errors.CustomBadRequest, ['duplicate option']);
            }

            let vote: IDB.Vote = new IDB.Vote();

            let _start: Date = _input.date.getTime() > _input.deadline.getTime() ? _input.deadline : _input.date;
            let _end: Date = _input.date.getTime() > _input.deadline.getTime() ? _input.date : _input.deadline;

            vote.setValue('creator', data.user);
            vote.setValue('community', _userInfo.community);
            vote.setValue('date', _start);
            vote.setValue('deadline', _end);
            vote.setValue('title', _input.title);
            vote.setValue('content', _input.content);
            vote.setValue(
                'options',
                _input.options.map((value, index, array) => {
                    return {
                        option: value,
                        residents: [],
                    };
                }),
            );
            vote.setValue('status', Enum.ReceiveStatus.unreceived);
            vote.setValue('aims', _input.aims);
            vote.setValue('isDeleted', false);

            await vote.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });

            let query: Parse.Query<IDB.CharacterResident> = new Parse.Query(IDB.CharacterResident).equalTo('community', _userInfo.community);

            let total: number = await query.count().fail((e) => {
                throw e;
            });
            let residents: IDB.CharacterResident[] = await query
                .limit(total)
                .find()
                .fail((e) => {
                    throw e;
                });

            residents.forEach((value, index, array) => {
                Notice.notice$.next({
                    resident: value,
                    type: Enum.MessageType.voteNew,
                    data: vote,
                    aims: _input.aims,
                    message: {
                        title: vote.getValue('title'),
                    },
                });
            });

            return {
                voteId: vote.id,
            };
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);

/**
 * Action Read
 */
type InputR = IRequest.IDataList & IRequest.IVote.IIndexR;

type OutputR = IResponse.IDataList<IResponse.IVote.IIndexR[]>;

action.get(
    {
        inputType: 'InputR',
        permission: [RoleList.Chairman, RoleList.DeputyChairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral, RoleList.Guard, RoleList.Resident],
    },
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;
            let _userInfo = await Db.GetUserInfo(data);
            let _page: number = _input.page || 1;
            let _count: number = _input.count || 10;

            let query: Parse.Query<IDB.Vote> = new Parse.Query(IDB.Vote).equalTo('community', _userInfo.community).equalTo('isDeleted', false);
            if (_input.start) {
                query.greaterThanOrEqualTo('createdAt', new Date(new Date(_input.start).setHours(0, 0, 0, 0)));
            }
            if (_input.end) {
                query.lessThan('createdAt', new Date(new Date(new Date(_input.end).setDate(_input.end.getDate() + 1)).setHours(0, 0, 0, 0)));
            }
            if (_input.status === 'received') {
                query.equalTo('status', Enum.ReceiveStatus.received);
            } else if (_input.status === 'unreceived') {
                query.equalTo('status', Enum.ReceiveStatus.unreceived);
            }

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
                    };
                }),
            };
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);

/**
 * Action update
 */
type InputU = IRequest.IVote.IIndexU;

type OutputU = Date;

action.put(
    {
        inputType: 'InputU',
        permission: [RoleList.Chairman, RoleList.DeputyChairman, RoleList.DirectorGeneral],
    },
    async (data): Promise<OutputU> => {
        try {
            let _input: InputU = data.inputType;
            let _userInfo = await Db.GetUserInfo(data);

            let _option: string = _input.options.find((value, index, array) => {
                return array.lastIndexOf(value) !== index;
            });
            if (_option) {
                throw Errors.throw(Errors.CustomBadRequest, ['duplicate option']);
            }

            let vote: IDB.Vote = await new Parse.Query(IDB.Vote).get(_input.voteId).fail((e) => {
                throw e;
            });
            if (!vote) {
                throw Errors.throw(Errors.CustomBadRequest, ['vote not found']);
            }
            if (vote.getValue('isDeleted')) {
                throw Errors.throw(Errors.CustomBadRequest, ['vote was deleted']);
            }

            if (vote.getValue('date').getTime() <= new Date().getTime()) {
                throw Errors.throw(Errors.CustomBadRequest, ['now is voting']);
            }

            let _start: Date = _input.date.getTime() > _input.deadline.getTime() ? _input.deadline : _input.date;
            let _end: Date = _input.date.getTime() > _input.deadline.getTime() ? _input.date : _input.deadline;

            vote.setValue('date', _start);
            vote.setValue('deadline', _end);
            vote.setValue('title', _input.title);
            vote.setValue('content', _input.content);
            vote.setValue(
                'options',
                _input.options.map((value, index, array) => {
                    return {
                        option: value,
                        residents: [],
                    };
                }),
            );

            await vote.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });

            let query: Parse.Query<IDB.CharacterResident> = new Parse.Query(IDB.CharacterResident).equalTo('community', _userInfo.community);

            let total: number = await query.count().fail((e) => {
                throw e;
            });
            let residents: IDB.CharacterResident[] = await query
                .limit(total)
                .find()
                .fail((e) => {
                    throw e;
                });

            residents.forEach((value, index, array) => {
                Notice.notice$.next({
                    resident: value,
                    type: Enum.MessageType.voteUpdate,
                    data: vote,
                    aims: vote.getValue('aims'),
                    message: {},
                });
            });

            return new Date();
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);

/**
 * Action Delete
 */
type InputD = IRequest.IVote.IIndexD;

type OutputD = Date;

action.delete(
    {
        inputType: 'InputD',
        permission: [RoleList.Chairman, RoleList.DeputyChairman, RoleList.DirectorGeneral],
    },
    async (data): Promise<OutputD> => {
        try {
            let _input: InputD = data.inputType;
            let _userInfo = await Db.GetUserInfo(data);
            let _voteIds: string[] = [].concat(data.parameters.voteIds);

            _voteIds = _voteIds.filter((value, index, array) => {
                return array.indexOf(value) === index;
            });

            let tasks: Promise<any>[] = _voteIds.map<any>((value, index, array) => {
                return new Parse.Query(IDB.Vote).get(value);
            });
            let votes: IDB.Vote[] = await Promise.all(tasks).catch((e) => {
                throw e;
            });

            tasks = votes.map<any>((value, index, array) => {
                value.setValue('isDeleted', true);

                return value.save(null, { useMasterKey: true });
            });
            await Promise.all(tasks).catch((e) => {
                throw e;
            });

            let query: Parse.Query<IDB.CharacterResident> = new Parse.Query(IDB.CharacterResident).equalTo('community', _userInfo.community);

            let total: number = await query.count().fail((e) => {
                throw e;
            });
            let residents: IDB.CharacterResident[] = await query
                .limit(total)
                .find()
                .fail((e) => {
                    throw e;
                });

            residents.forEach((value, index, array) => {
                votes.forEach((value1, index1, array1) => {
                    Notice.notice$.next({
                        resident: value,
                        type: Enum.MessageType.voteDelete,
                        aims: value1.getValue('aims'),
                        message: {
                            title: value1.getValue('title'),
                        },
                        data: value1,
                    });
                });
            });

            return new Date();
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
