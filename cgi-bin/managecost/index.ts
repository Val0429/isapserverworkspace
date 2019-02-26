import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, CharacterResident, ManageCost, Parking, CharacterCommittee } from '../../custom/models';
import * as Enum from '../../custom/enums';

let action = new Action({
    loginRequired: true,
});

export default action;

/**
 * Action Create
 */
type InputC = IRequest.IManageCost.IIndexC;

type OutputC = string;

action.post(
    {
        inputType: 'InputC',
        permission: [RoleList.SystemAdministrator, RoleList.Administrator, RoleList.Chairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral, RoleList.Guard],
    },
    async (data): Promise<OutputC> => {
        let _input: InputC = data.inputType;
        let _date: Date = new Date(new Date(new Date(_input.date).setDate(1)).setHours(0, 0, 0, 0));
        let _deadline: Date = new Date(new Date(_input.deadline).setHours(0, 0, 0, 0));

        let manageCostCount: number = await new Parse.Query(ManageCost)
            .equalTo('date', _date)
            .count()
            .catch((e) => {
                throw e;
            });

        if (manageCostCount > 0) {
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
            let manageCost: ManageCost = new ManageCost();

            manageCost.setValue('creator', data.user);
            manageCost.setValue('resident', value);
            manageCost.setValue('date', _date);
            manageCost.setValue('deadline', _deadline);
            manageCost.setValue('status', Enum.ReceiveStatus.unreceived);
            manageCost.setValue('total', value.getValue('manageCost'));
            manageCost.setValue('balance', value.getValue('manageCost'));

            return manageCost.save(null, { useMasterKey: true }).catch((e) => {
                throw e;
            });
        });

        await Promise.all(tasks).catch((e) => {
            throw e;
        });

        return '';
    },
);

/**
 * Action Read
 */
type InputR = IRequest.IDataList & IRequest.IManageCost.IIndexR;

type OutputR = IResponse.IDataList<IResponse.IManageCost.IIndexR[]>;

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

        let query: Parse.Query<ManageCost> = new Parse.Query(ManageCost).equalTo('date', _date);

        if (_input.status === 'received') {
            query.equalTo('status', Enum.ReceiveStatus.received);
        } else if (_input.status === 'unreceived') {
            query.equalTo('status', Enum.ReceiveStatus.unreceived);
        } else if (_input.status === 'overdue') {
            let deadline: Date = new Date(new Date().setHours(0, 0, 0, 0));
            query.greaterThan('status', Enum.ReceiveStatus.unreceived).lessThan('deadline', deadline);
        }

        let total: number = await query.count().catch((e) => {
            throw e;
        });

        let manageCosts: ManageCost[] = await query
            .skip((_page - 1) * _count)
            .limit(_count)
            .include('resident')
            .find()
            .catch((e) => {
                throw e;
            });

        let tasks: Promise<any>[] = manageCosts.map((value, index, array) => {
            return new Parse.Query(Parking)
                .equalTo('resident', value.getValue('resident'))
                .count()
                .catch((e) => {
                    throw e;
                });
        });
        let parkingCounts: number[] = await Promise.all(tasks).catch((e) => {
            throw e;
        });

        tasks = manageCosts.map((value, index, array) => {
            return new Parse.Query(CharacterCommittee)
                .equalTo('user', value.getValue('charger'))
                .first()
                .catch((e) => {
                    throw e;
                });
        });
        let chargers: CharacterCommittee[] = await Promise.all(tasks).catch((e) => {
            throw e;
        });

        return {
            total: total,
            page: _page,
            count: _count,
            content: manageCosts.map((value, index, array) => {
                return {
                    manageCostId: value.id,
                    residentId: value.getValue('resident').id,
                    date: value.getValue('date'),
                    address: value.getValue('resident').getValue('address'),
                    isParking: parkingCounts[index] > 0,
                    deadline: value.getValue('deadline'),
                    chargerName: chargers[index] ? chargers[index].getValue('name') : '',
                    status: value.getValue('status'),
                    total: value.getValue('total'),
                    balance: value.getValue('balance'),
                };
            }),
        };
    },
);
