import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, Vote, CharacterCommittee } from '../../custom/models';
import {} from '../../custom/helpers';
import * as Enum from '../../custom/enums';

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
        permission: [RoleList.SystemAdministrator, RoleList.Administrator, RoleList.Chairman, RoleList.DeputyChairman, RoleList.DirectorGeneral],
    },
    async (data): Promise<OutputC> => {
        let _input: InputC = data.inputType;

        let vote: Vote = new Vote();

        let _start: Date = _input.date.getTime() > _input.deadline.getTime() ? _input.deadline : _input.date;
        let _end: Date = _input.date.getTime() > _input.deadline.getTime() ? _input.date : _input.deadline;

        vote.setValue('creator', data.user);
        vote.setValue('date', _start);
        vote.setValue('deadline', _end);
        vote.setValue('title', _input.title);
        vote.setValue('content', _input.content);
        vote.setValue(
            'options',
            _input.options.map((value, index, array) => {
                return {
                    option: value,
                    resident: [],
                };
            }),
        );
        vote.setValue('status', Enum.ReceiveStatus.unreceived);

        await vote.save(null, { useMasterKey: true }).catch((e) => {
            throw e;
        });

        return {
            voteId: vote.id,
        };
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
        permission: [RoleList.SystemAdministrator, RoleList.Administrator, RoleList.Chairman, RoleList.DeputyChairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral, RoleList.Guard],
    },
    async (data): Promise<OutputR> => {
        let _input: InputR = data.inputType;
        let _page: number = _input.page || 1;
        let _count: number = _input.count || 10;

        let query: Parse.Query<Vote> = new Parse.Query(Vote);
        if (_input.start) {
            query.greaterThanOrEqualTo('createdAt', _input.start);
        }
        if (_input.end) {
            query.lessThan('createdAt', new Date(new Date(new Date(_input.end).setDate(_input.end.getDate() + 1)).setHours(0, 0, 0, 0)));
        }
        if (_input.status === 'received') {
            query.equalTo('status', Enum.ReceiveStatus.received);
        } else if (_input.status === 'unreceived') {
            query.equalTo('status', Enum.ReceiveStatus.unreceived);
        }

        let total: number = await query.count().catch((e) => {
            throw e;
        });

        let votes: Vote[] = await query
            .skip((_page - 1) * _count)
            .limit(_count)
            .find()
            .catch((e) => {
                throw e;
            });

        let tasks: Promise<any>[] = votes.map((value, index, array) => {
            return new Parse.Query(CharacterCommittee)
                .equalTo('user', value.getValue('creator'))
                .first()
                .catch((e) => {
                    throw e;
                });
        });
        let committees: CharacterCommittee[] = await Promise.all(tasks).catch((e) => {
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
                };
            }),
        };
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
        permission: [RoleList.SystemAdministrator, RoleList.Administrator, RoleList.Chairman, RoleList.DeputyChairman, RoleList.DirectorGeneral],
    },
    async (data): Promise<OutputU> => {
        let _input: InputU = data.inputType;

        let vote: Vote = await new Parse.Query(Vote).get(_input.voteId).catch((e) => {
            throw e;
        });
        if (!vote) {
            throw Errors.throw(Errors.CustomBadRequest, ['vote not found']);
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
                    resident: [],
                };
            }),
        );

        await vote.save(null, { useMasterKey: true }).catch((e) => {
            throw e;
        });

        return new Date();
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
        permission: [RoleList.SystemAdministrator, RoleList.Administrator, RoleList.Chairman, RoleList.DeputyChairman, RoleList.DirectorGeneral],
    },
    async (data): Promise<OutputD> => {
        let _input: InputD = data.inputType;
        let _voteIds: string[] = [].concat(data.parameters.voteIds);

        _voteIds = _voteIds.filter((value, index, array) => {
            return array.indexOf(value) === index;
        });

        let tasks: Promise<any>[] = _voteIds.map((value, index, array) => {
            return new Parse.Query(Vote).get(value);
        });
        let votes: Vote[] = await Promise.all(tasks).catch((e) => {
            throw e;
        });

        tasks = votes.map((value, index, array) => {
            return value.destroy({ useMasterKey: true });
        });
        await Promise.all(tasks).catch((e) => {
            throw e;
        });

        return new Date();
    },
);
