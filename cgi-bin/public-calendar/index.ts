import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, PublicCalendar, MessageResident, CharacterResident } from '../../custom/models';
import {} from '../../custom/helpers';
import * as Enum from '../../custom/enums';

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
        permission: [RoleList.SystemAdministrator, RoleList.Administrator, RoleList.Chairman, RoleList.DeputyChairman, RoleList.DirectorGeneral],
    },
    async (data): Promise<OutputC> => {
        let _input: InputC = data.inputType;

        let _start: Date = _input.date.startDate.getTime() > _input.date.endDate.getTime() ? _input.date.endDate : _input.date.startDate;
        let _end: Date = _input.date.startDate.getTime() > _input.date.endDate.getTime() ? _input.date.startDate : _input.date.endDate;

        let publicCalendar: PublicCalendar = new PublicCalendar();

        publicCalendar.setValue('creator', data.user);
        publicCalendar.setValue('date', { startDate: _start, endDate: _end });
        publicCalendar.setValue('title', _input.title);
        publicCalendar.setValue('content', _input.content);

        await publicCalendar.save(null, { useMasterKey: true }).catch((e) => {
            throw e;
        });

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
            let message: MessageResident = new MessageResident();

            message.setValue('resident', value);
            message.setValue('publicCalendar', publicCalendar);

            return message.save(null, { useMasterKey: true });
        });

        await Promise.all(tasks).catch((e) => {
            throw e;
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
        permission: [RoleList.SystemAdministrator, RoleList.Administrator, RoleList.Chairman, RoleList.DeputyChairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral, RoleList.Guard],
    },
    async (data): Promise<OutputR> => {
        let _input: InputR = data.inputType;

        let query: Parse.Query<PublicCalendar> = new Parse.Query(PublicCalendar);
        if (_input.start) {
            query.greaterThanOrEqualTo('date.start', new Date(new Date(_input.start).setHours(0, 0, 0, 0)));
        }
        if (_input.end) {
            query.lessThan('date.end', new Date(new Date(new Date(_input.end).setDate(_input.end.getDate() + 1)).setHours(0, 0, 0, 0)));
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
        permission: [RoleList.SystemAdministrator, RoleList.Administrator, RoleList.Chairman, RoleList.DeputyChairman, RoleList.DirectorGeneral],
    },
    async (data): Promise<OutputU> => {
        let _input: InputU = data.inputType;

        let publicCalendar: PublicCalendar = await new Parse.Query(PublicCalendar).get(_input.publicCalendarId).catch((e) => {
            throw e;
        });

        let _start: Date = _input.date.startDate.getTime() > _input.date.endDate.getTime() ? _input.date.endDate : _input.date.startDate;
        let _end: Date = _input.date.startDate.getTime() > _input.date.endDate.getTime() ? _input.date.startDate : _input.date.endDate;

        publicCalendar.setValue('date', { startDate: _start, endDate: _end });
        publicCalendar.setValue('title', _input.title);
        publicCalendar.setValue('content', _input.content);

        await publicCalendar.save(null, { useMasterKey: true }).catch((e) => {
            throw e;
        });

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
            let message: MessageResident = new MessageResident();

            message.setValue('resident', value);
            message.setValue('publicCalendar', publicCalendar);

            return message.save(null, { useMasterKey: true });
        });

        await Promise.all(tasks).catch((e) => {
            throw e;
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
        permission: [RoleList.SystemAdministrator, RoleList.Administrator, RoleList.Chairman, RoleList.DeputyChairman, RoleList.DirectorGeneral],
    },
    async (data): Promise<OutputD> => {
        let _input: InputD = data.inputType;
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
            return value.destroy({ useMasterKey: true });
        });
        await Promise.all(tasks).catch((e) => {
            throw e;
        });

        return new Date();
    },
);
