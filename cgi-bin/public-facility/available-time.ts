import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../custom/models';
import { Print, Db } from '../../custom/helpers';
import * as Enum from '../../custom/enums';
import Notice from '../../custom/actions/notice';

let action = new Action({
    loginRequired: true,
});

export default action;

/**
 * Action Read
 */
type InputR = IRequest.IPublicFacility.IAvailableTime;

type OutputR = IResponse.IPublicFacility.IAvailableTime;

action.get(
    {
        inputType: 'InputR',
        permission: [RoleList.Resident],
    },
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;
            let _userInfo = await Db.GetUserInfo(data);
            let _start: Date = new Date(new Date(_input.date).setHours(0, 0, 0, 0));
            let _end: Date = new Date(new Date(_start).setDate(_input.date.getDate() + 1));
            let _day: number = _input.date.getDay();

            let publicFacility: IDB.PublicFacility = await new Parse.Query(IDB.PublicFacility)
                .equalTo('community', _userInfo.community)
                .equalTo('isDeleted', false)
                .get(_input.publicFacilityId)
                .fail((e) => {
                    throw e;
                });
            if (!publicFacility) {
                throw Errors.throw(Errors.CustomBadRequest, ['public facility not found']);
            }

            let openHours: number[] = GetHours(publicFacility.getValue('openDates'), _day);

            let maintenanceHours: number[] = GetHours(publicFacility.getValue('maintenanceDates'), _day);
            openHours = openHours.filter((value, index, array) => {
                return maintenanceHours.indexOf(value) < 0;
            });

            let reservations: IDB.PublicFacilityReservation[] = await new Parse.Query(IDB.PublicFacilityReservation)
                .equalTo('community', _userInfo.community)
                .equalTo('isDeleted', false)
                .equalTo('facility', publicFacility)
                .greaterThanOrEqualTo('reservationDates.startDate', _start)
                .lessThan('reservationDates.startDate', _end)
                .find()
                .fail((e) => {
                    throw e;
                });

            let reservationHours: number[] = GetHours1(reservations);
            openHours = openHours.filter((value, index, array) => {
                return reservationHours.indexOf(value) < 0;
            });

            return {
                hours: openHours,
            };
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);

/**
 *
 * @param dayRange
 * @param day
 */
function GetHours(dayRange: IDB.IDayRange[], day: number): number[] {
    let hours: number[] = []
        .concat(
            ...dayRange
                .filter((value, index, array) => {
                    return parseInt(value.startDay) <= day && parseInt(value.endDay) >= day;
                })
                .map((value, index, array) => {
                    let _hours: number[] = [];
                    for (let i: number = value.startDate.getHours(); i <= value.endDate.getHours(); i++) {
                        _hours.push(i);
                    }

                    return _hours;
                }),
        )
        .filter((value, index, array) => {
            return array.indexOf(value) === index;
        });

    return hours;
}

/**
 *
 * @param reservations
 */
function GetHours1(reservations: IDB.PublicFacilityReservation[]): number[] {
    let hours: number[] = []
        .concat(
            ...reservations.map((value, index, array) => {
                let _date: IDB.IDateRange = value.getValue('reservationDates');
                let _hours: number[] = [];
                for (let i: number = _date.startDate.getHours(); i <= _date.endDate.getHours(); i++) {
                    _hours.push(i);
                }

                return _hours;
            }),
        )
        .filter((value, index, array) => {
            return array.indexOf(value) === index;
        });

    return hours;
}
