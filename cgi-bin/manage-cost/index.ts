import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../custom/models';
import { Db, Print, Utility } from '../../custom/helpers';
import * as Enum from '../../custom/enums';
import * as Notice from '../../custom/services/notice';

let action = new Action({
    loginRequired: true,
});

export default action;

/**
 * Action Create
 */
type InputC = IRequest.IManageCost.IIndexC;

type OutputC = Date;

action.post(
    {
        inputType: 'InputC',
        permission: [RoleList.Chairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral, RoleList.Guard],
    },
    async (data): Promise<OutputC> => {
        try {
            let _input: InputC = data.inputType;
            let _userInfo = await Db.GetUserInfo(data);
            let _date: Date = new Date(new Date(new Date(_input.date).setDate(1)).setHours(0, 0, 0, 0));
            let _deadline: Date = new Date(new Date(_input.deadline).setHours(0, 0, 0, 0));

            if (_input.date.getTime() > _input.deadline.getTime()) {
                throw Errors.throw(Errors.CustomBadRequest, ['date error']);
            }

            let manageCostCount: number = await new Parse.Query(IDB.ManageCost)
                .equalTo('community', _userInfo.community)
                .equalTo('date', _date)
                .count()
                .fail((e) => {
                    throw e;
                });
            if (manageCostCount > 0) {
                throw Errors.throw(Errors.CustomBadRequest, ['date presence']);
            }

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

            let tasks: Promise<any>[] = residents.map<any>((value, index, array) => {
                return new Parse.Query(IDB.Parking).equalTo('resident', value).find();
            });
            let parkings: IDB.Parking[][] = await Promise.all(tasks).catch((e) => {
                throw e;
            });

            let manageCosts: IDB.ManageCost[] = residents.map((value, index, array) => {
                let parkingCost: number = parkings[index]
                    ? parkings[index].reduce((prev, curr, index, array) => {
                          return prev + curr.getValue('cost');
                      }, 0)
                    : 0;

                let manageCost: IDB.ManageCost = new IDB.ManageCost();

                manageCost.setValue('creator', data.user);
                manageCost.setValue('community', _userInfo.community);
                manageCost.setValue('resident', value);
                manageCost.setValue('date', _date);
                manageCost.setValue('deadline', _deadline);
                manageCost.setValue('status', Enum.ReceiveStatus.unreceived);
                manageCost.setValue('parkingCost', parkingCost);
                manageCost.setValue('manageCost', value.getValue('manageCost'));
                manageCost.setValue('balance', manageCost.getValue('manageCost') + manageCost.getValue('parkingCost'));

                return manageCost;
            });

            let datas: Utility.ISortData[] = manageCosts.map((value, index, array) => {
                return {
                    key: value.getValue('resident').getValue('address'),
                    data: value.getValue('resident').getValue('address'),
                };
            });
            datas = Utility.NatSort(datas);

            let serials: string[] = datas.map((value, index, array) => {
                return value.key;
            });
            await Promise.all(
                manageCosts.map(async (value, index, array) => {
                    let serial: number = serials.indexOf(value.getValue('resident').getValue('address'));
                    value.setValue('serial', serial);

                    await value.save(null, { useMasterKey: true }).fail((e) => {
                        throw e;
                    });
                }),
            ).catch((e) => {
                throw e;
            });

            manageCosts.forEach((value, index, array) => {
                Notice.notice$.next({
                    resident: value.getValue('resident'),
                    type: Enum.MessageType.manageCostNew,
                    data: value,
                    message: {
                        YYYYMM: value.getValue('date'),
                        deadline: value.getValue('deadline'),
                    },
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
 * Action Read
 */
type InputR = IRequest.IDataList & IRequest.IManageCost.IIndexR;

type OutputR = IResponse.IDataList<IResponse.IManageCost.IIndexR[]>;

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

            let query: Parse.Query<IDB.ManageCost> = new Parse.Query(IDB.ManageCost).equalTo('community', _userInfo.community);

            if (_input.date) {
                let _date: Date = new Date(new Date(new Date(_input.date).setDate(1)).setHours(0, 0, 0, 0));
                query.equalTo('date', _date);
            }
            if (_input.status === 'received') {
                query.equalTo('status', Enum.ReceiveStatus.received);
            } else if (_input.status === 'unreceived') {
                query.equalTo('status', Enum.ReceiveStatus.unreceived);
            } else if (_input.status === 'overdue') {
                let deadline: Date = new Date(new Date().setHours(0, 0, 0, 0));
                query.equalTo('status', Enum.ReceiveStatus.unreceived).lessThan('deadline', deadline);
            }

            if (_userInfo.resident) {
                query.equalTo('resident', _userInfo.resident);
            }

            let total: number = await query.count().fail((e) => {
                throw e;
            });

            let manageCosts: IDB.ManageCost[] = await query
                .ascending('serial')
                .skip((_page - 1) * _count)
                .limit(_count)
                .include('resident')
                .find()
                .fail((e) => {
                    throw e;
                });

            let tasks: Promise<any>[] = manageCosts.map<any>((value, index, array) => {
                return new Parse.Query(IDB.Parking).equalTo('resident', value.getValue('resident')).count();
            });
            let parkingCounts: number[] = await Promise.all(tasks).catch((e) => {
                throw e;
            });

            tasks = manageCosts.map<any>((value, index, array) => {
                return new Parse.Query(IDB.CharacterCommittee).equalTo('user', value.getValue('charger')).first();
            });
            let chargers: IDB.CharacterCommittee[] = await Promise.all(tasks).catch((e) => {
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
                        parkingCost: value.getValue('parkingCost'),
                        manageCost: value.getValue('manageCost'),
                        balance: value.getValue('balance'),
                    };
                }),
            };
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
