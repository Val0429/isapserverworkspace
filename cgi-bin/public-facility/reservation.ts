import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../custom/models';
import { Print, Db } from '../../custom/helpers';
import * as Enum from '../../custom/enums';
import * as Notice from '../../custom/services/notice';

let action = new Action({
    loginRequired: true,
});

export default action;

/**
 * Action Create
 */
type InputC = IRequest.IPublicFacility.IReservationC;

type OutputC = IResponse.IPublicFacility.IReservationC;

action.post(
    {
        inputType: 'InputC',
        permission: [RoleList.DirectorGeneral, RoleList.Guard, RoleList.Resident],
    },
    async (data): Promise<OutputC> => {
        try {
            let _input: InputC = data.inputType;
            let _userInfo = await Db.GetUserInfo(data);

            let publicFacility: IDB.PublicFacility = await new Parse.Query(IDB.PublicFacility).get(_input.publicFacilityId).fail((e) => {
                throw e;
            });
            if (!publicFacility) {
                throw Errors.throw(Errors.CustomBadRequest, ['public facility not found']);
            }
            if (publicFacility.getValue('isDeleted')) {
                throw Errors.throw(Errors.CustomBadRequest, ['public facility was deleted']);
            }

            let resident: IDB.CharacterResident = await new Parse.Query(IDB.CharacterResident).get(_input.residentId).fail((e) => {
                throw e;
            });
            if (!resident) {
                throw Errors.throw(Errors.CustomBadRequest, ['resident not found']);
            }
            if (resident.getValue('pointBalance') < publicFacility.getValue('pointCost') * _input.count) {
                throw Errors.throw(Errors.CustomBadRequest, ['resident point not enough']);
            }

            let reservation: IDB.PublicFacilityReservation = new IDB.PublicFacilityReservation();

            let _start: Date = _input.reservationDates.startDate.getTime() > _input.reservationDates.endDate.getTime() ? _input.reservationDates.endDate : _input.reservationDates.startDate;
            let _end: Date = _input.reservationDates.startDate.getTime() > _input.reservationDates.endDate.getTime() ? _input.reservationDates.startDate : _input.reservationDates.endDate;

            reservation.setValue('creator', data.user);
            reservation.setValue('community', _userInfo.community);
            reservation.setValue('facility', publicFacility);
            reservation.setValue('resident', resident);
            reservation.setValue('count', _input.count);
            reservation.setValue('reservationDates', {
                startDate: _start,
                endDate: _end,
            });
            reservation.setValue('isDeleted', false);

            await reservation.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });

            resident.setValue('pointBalance', resident.getValue('pointBalance') - publicFacility.getValue('pointCost') * _input.count);

            await resident.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });

            Notice.notice$.next({
                resident: reservation.getValue('resident'),
                type: Enum.MessageType.publicFacilityReservationNew,
                data: reservation,
                message: {
                    facility: publicFacility.getValue('name'),
                    dateRange: reservation.getValue('reservationDates'),
                },
            });

            return {
                reservationId: reservation.id,
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
type InputR = IRequest.IDataList & IRequest.IPublicFacility.IReservationR;

type OutputR = IResponse.IDataList<IResponse.IPublicFacility.IReservationR[]>;

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

            let query: Parse.Query<IDB.PublicFacilityReservation> = new Parse.Query(IDB.PublicFacilityReservation).equalTo('community', _userInfo.community).equalTo('isDeleted', false);
            if (_input.start) {
                query.greaterThanOrEqualTo('reservationDates.startDate', new Date(new Date(_input.start).setHours(0, 0, 0, 0)));
            }
            if (_input.end) {
                query.lessThan('reservationDates.startDate', new Date(new Date(new Date(_input.end).setDate(_input.end.getDate() + 1)).setHours(0, 0, 0, 0)));
            }
            if (_input.publicFacilityId) {
                let facility: IDB.PublicFacility = new IDB.PublicFacility();
                facility.id = _input.publicFacilityId;

                query.equalTo('facility', facility);
            }

            if (_userInfo.resident) {
                query.equalTo('resident', _userInfo.resident);
            }

            let total: number = await query.count().fail((e) => {
                throw e;
            });

            let reservations: IDB.PublicFacilityReservation[] = await query
                .skip((_page - 1) * _count)
                .limit(_count)
                .include(['facility', 'article', 'resident'])
                .find()
                .fail((e) => {
                    throw e;
                });

            return {
                total: total,
                page: _page,
                count: _count,
                content: reservations.map((value, index, array) => {
                    return {
                        reservationId: value.id,
                        publicFacilityname: value.getValue('facility').getValue('name'),
                        publicFacilityLimit: value.getValue('facility').getValue('limit'),
                        publicFacilitySrc: value.getValue('facility').getValue('facilitySrc'),
                        publicFacilityPointCost: value.getValue('facility').getValue('pointCost'),
                        residentAddress: value.getValue('resident').getValue('address'),
                        residentPoint: value.getValue('resident').getValue('pointBalance'),
                        count: value.getValue('count'),
                        reservationDates: value.getValue('reservationDates'),
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
type InputU = IRequest.IPublicFacility.IReservationU;

type OutputU = Date;

action.put(
    {
        inputType: 'InputU',
        permission: [RoleList.DirectorGeneral, RoleList.Guard, RoleList.Resident],
    },
    async (data): Promise<OutputU> => {
        try {
            let _input: InputU = data.inputType;
            let _userInfo = await Db.GetUserInfo(data);

            let reservation: IDB.PublicFacilityReservation = await new Parse.Query(IDB.PublicFacilityReservation)
                .include(['facility', 'resident'])
                .get(_input.reservationId)
                .fail((e) => {
                    throw e;
                });
            if (!reservation) {
                throw Errors.throw(Errors.CustomBadRequest, ['reservation not found']);
            }
            if (reservation.getValue('isDeleted')) {
                throw Errors.throw(Errors.CustomBadRequest, ['reservation was deleted']);
            }
            if (reservation.getValue('resident').getValue('pointBalance') < -1 * (reservation.getValue('facility').getValue('pointCost') * (reservation.getValue('count') - _input.count))) {
                throw Errors.throw(Errors.CustomBadRequest, ['resident point not enough']);
            }

            let now: Date = new Date();
            if (reservation.getValue('reservationDates').startDate.getTime() < now.getTime()) {
                throw Errors.throw(Errors.CustomBadRequest, ['over time']);
            }

            let _start: Date = _input.reservationDates.startDate.getTime() > _input.reservationDates.endDate.getTime() ? _input.reservationDates.endDate : _input.reservationDates.startDate;
            let _end: Date = _input.reservationDates.startDate.getTime() > _input.reservationDates.endDate.getTime() ? _input.reservationDates.startDate : _input.reservationDates.endDate;

            reservation.getValue('resident').setValue('pointBalance', reservation.getValue('resident').getValue('pointBalance') + reservation.getValue('facility').getValue('pointCost') * (reservation.getValue('count') - _input.count));
            reservation.setValue('count', _input.count);
            reservation.setValue('reservationDates', {
                startDate: _start,
                endDate: _end,
            });

            await reservation.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });

            Notice.notice$.next({
                resident: reservation.getValue('resident'),
                type: Enum.MessageType.publicFacilityReservationUpdate,
                data: reservation,
                message: {},
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
type InputD = IRequest.IPublicFacility.IReservationD;

type OutputD = Date;

action.delete(
    {
        inputType: 'InputD',
        permission: [RoleList.DirectorGeneral, RoleList.Guard],
    },
    async (data): Promise<OutputD> => {
        try {
            let _input: InputD = data.inputType;
            let _userInfo = await Db.GetUserInfo(data);
            let _reservationIds: string[] = [].concat(data.parameters.reservationIds);

            _reservationIds = _reservationIds.filter((value, index, array) => {
                return array.indexOf(value) === index;
            });

            let tasks: Promise<any>[] = _reservationIds.map<any>((value, index, array) => {
                return new Parse.Query(IDB.PublicFacilityReservation).include(['facility', 'resident']).get(value);
            });
            let reservations: IDB.PublicFacilityReservation[] = await Promise.all(tasks).catch((e) => {
                throw e;
            });

            let now: Date = new Date();

            tasks = [].concat(
                ...reservations.map<any>((value, index, array) => {
                    value.setValue('isDeleted', true);

                    let _tasks: Promise<any>[] = [<any>value.save(null, { useMasterKey: true })];

                    if (value.getValue('reservationDates').startDate.getTime() > now.getTime()) {
                        value.getValue('resident').setValue('pointBalance', value.getValue('resident').getValue('pointBalance') + value.getValue('count') * value.getValue('facility').getValue('pointCost'));
                        _tasks.push(<any>value.getValue('resident').save(null, { useMasterKey: true }));
                    }

                    return _tasks;
                }),
            );
            await Promise.all(tasks).catch((e) => {
                throw e;
            });

            reservations.forEach((value, index, array) => {
                Notice.notice$.next({
                    resident: value.getValue('resident'),
                    type: Enum.MessageType.publicFacilityReservationDelete,
                    message: {
                        facility: value.getValue('facility').getValue('name'),
                        dateRange: value.getValue('reservationDates'),
                    },
                    data: value,
                });
            });

            return new Date();
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
