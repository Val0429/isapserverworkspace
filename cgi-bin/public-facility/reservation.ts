import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, PublicFacility, PublicFacilityReservation, CharacterResident, CharacterResidentInfo, MessageResident } from '../../custom/models';
import * as Enum from '../../custom/enums';
import { Print } from '../../custom/helpers';
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
        permission: [RoleList.SystemAdministrator, RoleList.Administrator, RoleList.DirectorGeneral, RoleList.Guard],
    },
    async (data): Promise<OutputC> => {
        let _input: InputC = data.inputType;

        let publicFacility: PublicFacility = await new Parse.Query(PublicFacility).get(_input.publicFacilityId).catch((e) => {
            throw e;
        });
        if (!publicFacility) {
            throw Errors.throw(Errors.CustomBadRequest, ['public facility not found']);
        }

        let resident: CharacterResident = await new Parse.Query(CharacterResident).get(_input.residentId).catch((e) => {
            throw e;
        });
        if (!resident) {
            throw Errors.throw(Errors.CustomBadRequest, ['resident not found']);
        }
        if (resident.getValue('pointBalance') < publicFacility.getValue('pointCost') * _input.count) {
            throw Errors.throw(Errors.CustomBadRequest, ['resident point not enough']);
        }

        let reservation: PublicFacilityReservation = new PublicFacilityReservation();

        let _start: Date = _input.reservationDates.startDate.getTime() > _input.reservationDates.endDate.getTime() ? _input.reservationDates.endDate : _input.reservationDates.startDate;
        let _end: Date = _input.reservationDates.startDate.getTime() > _input.reservationDates.endDate.getTime() ? _input.reservationDates.startDate : _input.reservationDates.endDate;

        reservation.setValue('creator', data.user);
        reservation.setValue('facility', publicFacility);
        reservation.setValue('resident', resident);
        reservation.setValue('count', _input.count);
        reservation.setValue('reservationDates', {
            startDate: _start,
            endDate: _end,
        });

        await reservation.save(null, { useMasterKey: true }).catch((e) => {
            throw e;
        });

        resident.setValue('pointBalance', resident.getValue('pointBalance') - publicFacility.getValue('pointCost') * _input.count);

        await resident.save(null, { useMasterKey: true }).catch((e) => {
            throw e;
        });

        Notice.notice$.next({
            resident: reservation.getValue('resident'),
            type: Enum.MessageType.publicFacilityReservationNew,
            data: reservation,
            message: {
                date: new Date(),
                content: ``,
            },
        });

        return {
            reservationId: reservation.id,
        };
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
        permission: [RoleList.SystemAdministrator, RoleList.Administrator, RoleList.Chairman, RoleList.DeputyChairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral, RoleList.Guard],
    },
    async (data): Promise<OutputR> => {
        let _input: InputR = data.inputType;
        let _page: number = _input.page || 1;
        let _count: number = _input.count || 10;

        let query: Parse.Query<PublicFacilityReservation> = new Parse.Query(PublicFacilityReservation);
        if (_input.start) {
            query.greaterThanOrEqualTo('createdAt', new Date(new Date(_input.start).setHours(0, 0, 0, 0)));
        }
        if (_input.end) {
            query.lessThan('createdAt', new Date(new Date(new Date(_input.end).setDate(_input.end.getDate() + 1)).setHours(0, 0, 0, 0)));
        }
        if (_input.publicFacilityId) {
            let facility: PublicFacility = new PublicFacility();
            facility.id = _input.publicFacilityId;

            query.equalTo('facility', facility);
        }

        let total: number = await query.count().catch((e) => {
            throw e;
        });

        let reservations: PublicFacilityReservation[] = await query
            .skip((_page - 1) * _count)
            .limit(_count)
            .include('facility')
            .include('resident')
            .find()
            .catch((e) => {
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
        permission: [RoleList.SystemAdministrator, RoleList.Administrator, RoleList.DirectorGeneral, RoleList.Guard],
    },
    async (data): Promise<OutputU> => {
        let _input: InputU = data.inputType;

        let reservation: PublicFacilityReservation = await new Parse.Query(PublicFacilityReservation)
            .include('facility')
            .include('resident')
            .get(_input.reservationId)
            .catch((e) => {
                throw e;
            });
        if (!reservation) {
            throw Errors.throw(Errors.CustomBadRequest, ['reservation not found']);
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
        reservation.setValue('creator', data.user);
        reservation.setValue('count', _input.count);
        reservation.setValue('reservationDates', {
            startDate: _start,
            endDate: _end,
        });

        await reservation.save(null, { useMasterKey: true }).catch((e) => {
            throw e;
        });

        Notice.notice$.next({
            resident: reservation.getValue('resident'),
            type: Enum.MessageType.publicFacilityReservationUpdate,
            data: reservation,
            message: {
                date: new Date(),
                content: ``,
            },
        });

        return new Date();
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
        permission: [RoleList.SystemAdministrator, RoleList.Administrator, RoleList.DirectorGeneral, RoleList.Guard],
    },
    async (data): Promise<OutputD> => {
        let _input: InputD = data.inputType;
        let _reservationIds: string[] = [].concat(data.parameters.reservationIds);

        _reservationIds = _reservationIds.filter((value, index, array) => {
            return array.indexOf(value) === index;
        });

        let tasks: Promise<any>[] = _reservationIds.map((value, index, array) => {
            return new Parse.Query(PublicFacilityReservation)
                .include('facility')
                .include('resident')
                .get(value);
        });
        let reservations: PublicFacilityReservation[] = await Promise.all(tasks).catch((e) => {
            throw e;
        });

        let now: Date = new Date();

        tasks = [].concat(
            ...reservations.map((value, index, array) => {
                let _tasks: Promise<any>[] = [value.destroy({ useMasterKey: true })];

                if (value.getValue('reservationDates').startDate.getTime() > now.getTime()) {
                    value.getValue('resident').setValue('pointBalance', value.getValue('resident').getValue('pointBalance') + value.getValue('count') * value.getValue('facility').getValue('pointCost'));
                    _tasks.push(value.getValue('resident').save(null, { useMasterKey: true }));
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
                    date: new Date(),
                    content: ``,
                },
            });
        });

        return new Date();
    },
);
