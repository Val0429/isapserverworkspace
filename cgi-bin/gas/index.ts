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
type InputC = IRequest.IGas.IIndexC;

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

            if (_date.getTime() > _deadline.getTime()) {
                throw Errors.throw(Errors.CustomBadRequest, ['date error']);
            }

            let gasCount: number = await new Parse.Query(IDB.Gas)
                .equalTo('community', _userInfo.community)
                .equalTo('date', _date)
                .count()
                .fail((e) => {
                    throw e;
                });
            if (gasCount > 0) {
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

            let gass: IDB.Gas[] = residents.map((value, index, array) => {
                let gas: IDB.Gas = new IDB.Gas();

                gas.setValue('creator', data.user);
                gas.setValue('community', _userInfo.community);
                gas.setValue('resident', value);
                gas.setValue('date', _date);
                gas.setValue('deadline', _deadline);
                gas.setValue('degree', 0);

                return gas;
            });

            let datas: Utility.ISortData[] = gass.map((value, index, array) => {
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
                gass.map(async (value, index, array) => {
                    let serial: number = serials.indexOf(value.getValue('resident').getValue('address'));
                    value.setValue('serial', serial);

                    await value.save(null, { useMasterKey: true }).fail((e) => {
                        throw e;
                    });
                }),
            ).catch((e) => {
                throw e;
            });

            gass.forEach((value, index, array) => {
                Notice.notice$.next({
                    resident: value.getValue('resident'),
                    type: Enum.MessageType.gasNew,
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
type InputR = IRequest.IDataList & IRequest.IGas.IIndexR;

type OutputR = IResponse.IDataList<IResponse.IGas.IIndexR[]>;

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

            let query: Parse.Query<IDB.Gas> = new Parse.Query(IDB.Gas).equalTo('community', _userInfo.community);

            if (_input.date) {
                let _date: Date = new Date(new Date(new Date(_input.date).setDate(1)).setHours(0, 0, 0, 0));
                query.equalTo('date', _date);
            }
            if (_input.status === 'filled') {
                query.notEqualTo('degree', 0);
            } else if (_input.status === 'unfilled') {
                query.equalTo('degree', 0);
            } else if (_input.status === 'overdue') {
                let deadline: Date = new Date(new Date().setHours(0, 0, 0, 0));
                query.equalTo('degree', 0).lessThan('deadline', deadline);
            }

            if (_userInfo.resident) {
                query.equalTo('resident', _userInfo.resident);
            }

            let total: number = await query.count().fail((e) => {
                throw e;
            });

            let gass: IDB.Gas[] = await query
                .ascending('serial')
                .skip((_page - 1) * _count)
                .limit(_count)
                .include('resident')
                .find()
                .fail((e) => {
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
                        status: _input.status,
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
type InputU = IRequest.IGas.IIndexU;

type OutputU = Date;

action.put(
    {
        inputType: 'InputU',
        permission: [RoleList.Chairman, RoleList.DeputyChairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral, RoleList.Guard, RoleList.Resident],
    },
    async (data): Promise<OutputU> => {
        try {
            let _input: InputU = data.inputType;
            let _userInfo = await Db.GetUserInfo(data);

            if (_input.degree === 0) {
                throw Errors.throw(Errors.CustomBadRequest, ['degree error']);
            }

            let gas: IDB.Gas = await new Parse.Query(IDB.Gas).get(_input.gasId).fail((e) => {
                throw e;
            });
            if (!gas) {
                throw Errors.throw(Errors.CustomBadRequest, ['gas not found']);
            }

            gas.setValue('degree', _input.degree);

            await gas.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });

            Notice.notice$.next({
                resident: gas.getValue('resident'),
                type: Enum.MessageType.gasUpdate,
                data: gas,
                message: {},
            });

            return new Date();
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
