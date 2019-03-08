import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, CharacterResident, CharacterResidentInfo, Visitor } from '../../custom/models';
import { File } from '../../custom/helpers';
import * as Enum from '../../custom/enums';
import * as Notice from '../../custom/services/notice';
import { CheckResident } from '../user/resident/info';

let action = new Action({
    loginRequired: true,
});

export default action;

/**
 * Action Create
 */
type InputC = IRequest.IVisitor.IIndexC;

type OutputC = IResponse.IVisitor.IIndexC;

action.post(
    {
        inputType: 'InputC',
        postSizeLimit: 10000000,
        permission: [RoleList.SystemAdministrator, RoleList.Administrator, RoleList.DirectorGeneral, RoleList.Guard],
    },
    async (data): Promise<OutputC> => {
        let _input: InputC = data.inputType;

        let resident: CharacterResident = await new Parse.Query(CharacterResident).get(_input.residentId).catch((e) => {
            throw e;
        });
        if (!resident) {
            throw Errors.throw(Errors.CustomBadRequest, ['resident not found']);
        }

        let visitor: Visitor = new Visitor();

        visitor.setValue('creator', data.user);
        visitor.setValue('resident', resident);
        visitor.setValue('name', _input.visitorName);
        visitor.setValue('visitorSrc', '');
        visitor.setValue('count', _input.visitorCount);
        visitor.setValue('purpose', _input.purpose);
        visitor.setValue('memo', _input.memo);
        visitor.setValue('notificateCount', 0);

        await visitor.save(null, { useMasterKey: true }).catch((e) => {
            throw e;
        });

        let visitorSrc: string = `images/${visitor.id}_visitor_${visitor.createdAt.getTime()}.png`;
        File.WriteBase64File(`${File.assetsPath}/${visitorSrc}`, _input.visitorImage);

        visitor.setValue('visitorSrc', visitorSrc);

        await visitor.save(null, { useMasterKey: true }).catch((e) => {
            throw e;
        });

        Notice.notice$.next({
            resident: resident,
            type: Enum.MessageType.visitorNew,
            data: visitor,
            message: {
                visitor: visitor.getValue('name'),
            },
        });

        return {
            visitorId: visitor.id,
        };
    },
);

/**
 * Action Read
 */
type InputR = IRequest.IDataList & IRequest.IVisitor.IIndexR;

type OutputR = IResponse.IDataList<IResponse.IVisitor.IIndexR[]>;

action.get(
    {
        inputType: 'InputR',
        permission: [RoleList.SystemAdministrator, RoleList.Administrator, RoleList.Chairman, RoleList.DeputyChairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral, RoleList.Guard, RoleList.Resident],
    },
    async (data): Promise<OutputR> => {
        let _input: InputR = data.inputType;
        let _page: number = _input.page || 1;
        let _count: number = _input.count || 10;
        let _divideMinute: number = _input.divideMinute || 30;
        let _divideDate: Date = new Date();

        _divideDate = new Date(_divideDate.setMinutes(_divideDate.getMinutes() + _divideMinute));

        let query: Parse.Query<Visitor> = new Parse.Query(Visitor);
        if (_input.start) {
            query.greaterThanOrEqualTo('createdAt', new Date(new Date(_input.start).setHours(0, 0, 0, 0)));
        }
        if (_input.end) {
            query.lessThan('createdAt', new Date(new Date(new Date(_input.end).setDate(_input.end.getDate() + 1)).setHours(0, 0, 0, 0)));
        }
        if (_input.status === 'curr') {
            query.greaterThan('createdAt', _divideDate);
        } else if (_input.status === 'prev') {
            query.lessThan('createdAt', _divideDate);
        }

        let residentInfo: CharacterResidentInfo = await CheckResident(data);
        if (residentInfo) {
            query.equalTo('resident', residentInfo.getValue('resident'));
        }

        let total: number = await query.count().catch((e) => {
            throw e;
        });

        let visitors: Visitor[] = await query
            .skip((_page - 1) * _count)
            .limit(_count)
            .include('resident')
            .find()
            .catch((e) => {
                throw e;
            });

        let tasks: Promise<any>[] = visitors.map((value, index, array) => {
            return new Parse.Query(CharacterResidentInfo).equalTo('resident', value.getValue('resident')).first();
        });
        let residentInfos: CharacterResidentInfo[] = await Promise.all(tasks).catch((e) => {
            throw e;
        });

        return {
            total: total,
            page: _page,
            count: _count,
            content: visitors.map((value, index, array) => {
                return {
                    visitorId: value.id,
                    date: value.createdAt,
                    residentName: residentInfos[index] ? residentInfos[index].getValue('name') : '',
                    residentAddress: value.getValue('name'),
                    name: value.getValue('name'),
                    visitorSrc: value.getValue('visitorSrc'),
                    count: value.getValue('count'),
                    purpose: value.getValue('purpose'),
                    memo: value.getValue('memo'),
                    notificateCount: value.getValue('notificateCount'),
                    status: _input.status,
                };
            }),
        };
    },
);

/**
 * Action Delete
 */
type InputD = IRequest.IVisitor.IIndexD;

type OutputD = Date;

action.delete(
    {
        inputType: 'InputD',
        permission: [RoleList.SystemAdministrator, RoleList.Administrator, RoleList.Chairman, RoleList.DeputyChairman, RoleList.FinanceCommittee],
    },
    async (data): Promise<OutputD> => {
        let _input: InputD = data.inputType;
        let _visitorIds: string[] = [].concat(data.parameters.visitorIds);

        _visitorIds = _visitorIds.filter((value, index, array) => {
            return array.indexOf(value) === index;
        });

        let tasks: Promise<any>[] = _visitorIds.map((value, index, array) => {
            return new Parse.Query(Visitor).get(value);
        });
        let visitors: Visitor[] = await Promise.all(tasks).catch((e) => {
            throw e;
        });

        tasks = visitors.map((value, index, array) => {
            return value.destroy({ useMasterKey: true });
        });
        await Promise.all(tasks).catch((e) => {
            throw e;
        });

        visitors.forEach((value, index, array) => {
            File.DeleteFile(`${File.assetsPath}/${value.getValue('visitorSrc')}`);
        });

        visitors.forEach((value, index, array) => {
            Notice.notice$.next({
                resident: value.getValue('resident'),
                type: Enum.MessageType.visitorDelete,
                message: {
                    visitor: value.getValue('name'),
                },
            });
        });

        return new Date();
    },
);
