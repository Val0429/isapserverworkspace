import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, PublicCalendar, CharacterResidentInfo, CharacterResident } from '../../custom/models';
import { Db } from '../../custom/helpers';
import * as Enum from '../../custom/enums';
import * as Notice from '../../custom/services/notice';

let action = new Action({
    loginRequired: true,
});

export default action;

/**
 * Action Create
 */
type InputC = IRequest.IPublicCalendar.IIndexC;

type OutputC = IResponse.IPublicCalendar.IIndexC;

action.post(
    {
        inputType: 'InputC',
        permission: [RoleList.Chairman, RoleList.DeputyChairman, RoleList.DirectorGeneral],
    },
    async (data): Promise<OutputC> => {
        let _input: InputC = data.inputType;
        let _userInfo = await Db.GetUserInfo(data);

        let _start: Date = _input.date.startDate.getTime() > _input.date.endDate.getTime() ? _input.date.endDate : _input.date.startDate;
        let _end: Date = _input.date.startDate.getTime() > _input.date.endDate.getTime() ? _input.date.startDate : _input.date.endDate;

        let publicCalendar: PublicCalendar = new PublicCalendar();

        publicCalendar.setValue('creator', data.user);
        publicCalendar.setValue('community', _userInfo.community);
        publicCalendar.setValue('date', { startDate: _start, endDate: _end });
        publicCalendar.setValue('title', _input.title);
        publicCalendar.setValue('content', _input.content);
        publicCalendar.setValue('aims', _input.aims);
        publicCalendar.setValue('isDeleted', false);

        await publicCalendar.save(null, { useMasterKey: true }).catch((e) => {
            throw e;
        });

        let query: Parse.Query<CharacterResident> = new Parse.Query(CharacterResident).equalTo('community', _userInfo.community);

        let total: number = await query.count().catch((e) => {
            throw e;
        });
        let residents: CharacterResident[] = await query
            .limit(total)
            .find()
            .catch((e) => {
                throw e;
            });

        residents.forEach((value, index, array) => {
            Notice.notice$.next({
                resident: value,
                type: Enum.MessageType.publicCalendarNew,
                data: publicCalendar,
                aims: _input.aims,
                message: {
                    dateRange: publicCalendar.getValue('date'),
                    title: publicCalendar.getValue('title'),
                },
            });
        });

        return {
            publicCalendarId: publicCalendar.id,
        };
    },
);

/**
 * Action Read
 */
type InputR = IRequest.IPublicCalendar.IIndexR;

type OutputR = IResponse.IPublicCalendar.IIndexR[];

action.get(
    {
        inputType: 'InputR',
        permission: [RoleList.Chairman, RoleList.DeputyChairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral, RoleList.Guard, RoleList.Resident],
    },
    async (data): Promise<OutputR> => {
        let _input: InputR = data.inputType;
        let _userInfo = await Db.GetUserInfo(data);

        let query: Parse.Query<PublicCalendar> = new Parse.Query(PublicCalendar).equalTo('community', _userInfo.community).equalTo('isDeleted', false);
        if (_input.start) {
            query.greaterThanOrEqualTo('date.start', new Date(new Date(_input.start).setHours(0, 0, 0, 0)));
        }
        if (_input.end) {
            query.lessThan('date.end', new Date(new Date(new Date(_input.end).setDate(_input.end.getDate() + 1)).setHours(0, 0, 0, 0)));
        }

        if (_userInfo.residentInfo) {
            query.containedIn('aims', [_userInfo.residentInfo.getValue('character')]);
        }

        let total: number = await query.count().catch((e) => {
            throw e;
        });

        let publicCalendars: PublicCalendar[] = await query
            .limit(_input.count ? _input.count : total)
            .find()
            .catch((e) => {
                throw e;
            });

        return publicCalendars.map((value, index, array) => {
            return {
                publicCalendarId: value.id,
                date: value.getValue('date'),
                title: value.getValue('title'),
                content: value.getValue('content'),
                aims: value.getValue('aims'),
            };
        });
    },
);

/**
 * Action update
 */
type InputU = IRequest.IPublicCalendar.IIndexU;

type OutputU = Date;

action.put(
    {
        inputType: 'InputU',
        permission: [RoleList.Chairman, RoleList.DeputyChairman, RoleList.DirectorGeneral],
    },
    async (data): Promise<OutputU> => {
        let _input: InputU = data.inputType;
        let _userInfo = await Db.GetUserInfo(data);

        let publicCalendar: PublicCalendar = await new Parse.Query(PublicCalendar).get(_input.publicCalendarId).catch((e) => {
            throw e;
        });
        if (publicCalendar.getValue('isDeleted')) {
            throw Errors.throw(Errors.CustomBadRequest, ['public calendar was deleted']);
        }

        let _start: Date = _input.date.startDate.getTime() > _input.date.endDate.getTime() ? _input.date.endDate : _input.date.startDate;
        let _end: Date = _input.date.startDate.getTime() > _input.date.endDate.getTime() ? _input.date.startDate : _input.date.endDate;

        publicCalendar.setValue('date', { startDate: _start, endDate: _end });
        publicCalendar.setValue('title', _input.title);
        publicCalendar.setValue('content', _input.content);

        await publicCalendar.save(null, { useMasterKey: true }).catch((e) => {
            throw e;
        });

        let query: Parse.Query<CharacterResident> = new Parse.Query(CharacterResident).equalTo('community', _userInfo.community);

        let total: number = await query.count().catch((e) => {
            throw e;
        });
        let residents: CharacterResident[] = await query
            .limit(total)
            .find()
            .catch((e) => {
                throw e;
            });

        residents.forEach((value, index, array) => {
            Notice.notice$.next({
                resident: value,
                type: Enum.MessageType.publicCalendarUpdate,
                data: publicCalendar,
                aims: publicCalendar.getValue('aims'),
                message: {
                    dateRange: publicCalendar.getValue('date'),
                    title: publicCalendar.getValue('title'),
                },
            });
        });

        return new Date();
    },
);

/**
 * Action Delete
 */
type InputD = IRequest.IPublicCalendar.IIndexD;

type OutputD = Date;

action.delete(
    {
        inputType: 'InputD',
        permission: [RoleList.Chairman, RoleList.DeputyChairman, RoleList.DirectorGeneral],
    },
    async (data): Promise<OutputD> => {
        let _input: InputD = data.inputType;
        let _userInfo = await Db.GetUserInfo(data);
        let _publicCalendarIds: string[] = [].concat(data.parameters.publicCalendarIds);

        _publicCalendarIds = _publicCalendarIds.filter((value, index, array) => {
            return array.indexOf(value) === index;
        });

        let tasks: Promise<any>[] = _publicCalendarIds.map((value, index, array) => {
            return new Parse.Query(PublicCalendar).get(value);
        });
        let publicCalendars: PublicCalendar[] = await Promise.all(tasks).catch((e) => {
            throw e;
        });

        tasks = publicCalendars.map((value, index, array) => {
            value.setValue('isDeleted', true);

            return value.save(null, { useMasterKey: true });
        });
        await Promise.all(tasks).catch((e) => {
            throw e;
        });

        let query: Parse.Query<CharacterResident> = new Parse.Query(CharacterResident).equalTo('community', _userInfo.community);

        let total: number = await query.count().catch((e) => {
            throw e;
        });
        let residents: CharacterResident[] = await query
            .limit(total)
            .find()
            .catch((e) => {
                throw e;
            });

        residents.forEach((value, index, array) => {
            publicCalendars.forEach((value1, index1, array1) => {
                Notice.notice$.next({
                    resident: value,
                    type: Enum.MessageType.publicCalendarDelete,
                    aims: value1.getValue('aims'),
                    message: {
                        dateRange: value1.getValue('date'),
                        title: value1.getValue('title'),
                    },
                    data: value1,
                });
            });
        });

        return new Date();
    },
);
