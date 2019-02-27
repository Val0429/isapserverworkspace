import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, Gas, CharacterResident } from '../../custom/models';

let action = new Action({
    loginRequired: true,
});

export default action;

/**
 * Action Create
 */
type InputC = IRequest.IGas.IIndexC;

type OutputC = Date;

action.post(
    {
        inputType: 'InputC',
        permission: [RoleList.SystemAdministrator, RoleList.Administrator, RoleList.Chairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral, RoleList.Guard],
    },
    async (data): Promise<OutputC> => {
        let _input: InputC = data.inputType;
        let _date: Date = new Date(new Date(new Date(_input.date).setDate(1)).setHours(0, 0, 0, 0));
        let _deadline: Date = new Date(new Date(_input.deadline).setHours(0, 0, 0, 0));

        let gasCount: number = await new Parse.Query(Gas)
            .equalTo('date', _date)
            .count()
            .catch((e) => {
                throw e;
            });

        if (gasCount > 0) {
            throw Errors.throw(Errors.CustomBadRequest, ['date presence']);
        }

        let query: Parse.Query<CharacterResident> = new Parse.Query(CharacterResident);

        let total: number = await query.count().catch((e) => {
            throw e;
        });
        let residents: CharacterResident[] = await query
            .limit(total)
            .find()
            .catch((e) => {
                throw e;
            });

        let tasks: Promise<any>[] = residents.map((value, index, array) => {
            let gas: Gas = new Gas();

            gas.setValue('creator', data.user);
            gas.setValue('resident', value);
            gas.setValue('date', _date);
            gas.setValue('deadline', _deadline);
            gas.setValue('degree', 0);

            return gas.save(null, { useMasterKey: true }).catch((e) => {
                throw e;
            });
        });

        await Promise.all(tasks).catch((e) => {
            throw e;
        });

        return new Date();
    },
);

/**
 * Action Read
 */
type InputR = IRequest.IDataList & IRequest.IGas.IIndexR;

type OutputR = IResponse.IDataList<IResponse.IGas.IIndexR[]>;

action.get(
    {
        inputType: 'InputR',
        permission: [RoleList.SystemAdministrator, RoleList.Administrator, RoleList.Chairman, RoleList.DeputyChairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral, RoleList.Guard],
    },
    async (data): Promise<OutputR> => {
        let _input: InputR = data.inputType;
        let _page: number = _input.page || 1;
        let _count: number = _input.count || 10;
        let _date: Date = new Date(new Date(new Date(_input.date).setDate(1)).setHours(0, 0, 0, 0));

        let query: Parse.Query<Gas> = new Parse.Query(Gas).equalTo('date', _date);

        if (_input.status === 'filled') {
            query.notEqualTo('degree', 0);
        } else if (_input.status === 'unfilled') {
            query.equalTo('degree', 0);
        } else if (_input.status === 'overdue') {
            let deadline: Date = new Date(new Date().setHours(0, 0, 0, 0));
            query.equalTo('degree', 0).lessThan('deadline', deadline);
        }

        let total: number = await query.count().catch((e) => {
            throw e;
        });

        let gass: Gas[] = await query
            .skip((_page - 1) * _count)
            .limit(_count)
            .include('resident')
            .find()
            .catch((e) => {
                throw e;
            });

        return {
            total: total,
            page: _page,
            count: _count,
            content: gass.map((value, index, array) => {
                return {
                    gasId: value.id,
                    residentId: value.getValue('resident').id,
                    date: value.getValue('date'),
                    address: value.getValue('resident').getValue('address'),
                    deadline: value.getValue('deadline'),
                    degree: value.getValue('degree'),
                };
            }),
        };
    },
);

/**
 * Action update
 */
type InputU = IRequest.IGas.IIndexU;

type OutputU = Date;

action.put(
    {
        inputType: 'InputU',
        permission: [RoleList.SystemAdministrator, RoleList.Administrator, RoleList.Chairman, RoleList.DeputyChairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral, RoleList.Guard],
    },
    async (data): Promise<OutputU> => {
        let _input: InputU = data.inputType;

        if (_input.degree === 0) {
            throw Errors.throw(Errors.CustomBadRequest, ['degree error']);
        }

        let gas: Gas = await new Parse.Query(Gas).get(_input.gasId).catch((e) => {
            throw e;
        });
        if (!gas) {
            throw Errors.throw(Errors.CustomBadRequest, ['gas not found']);
        }

        gas.setValue('degree', _input.degree);

        await gas.save(null, { useMasterKey: true }).catch((e) => {
            throw e;
        });

        return new Date();
    },
);
