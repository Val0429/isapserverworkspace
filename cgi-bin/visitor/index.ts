import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../custom/models';
import { File, Db } from '../../custom/helpers';
import * as Enum from '../../custom/enums';
import * as Notice from '../../custom/services/notice';

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
        permission: [RoleList.DirectorGeneral, RoleList.Guard],
    },
    async (data): Promise<OutputC> => {
        let _input: InputC = data.inputType;
        let _userInfo = await Db.GetUserInfo(data);

        let resident: IDB.CharacterResident = await new Parse.Query(IDB.CharacterResident).get(_input.residentId).catch((e) => {
            throw e;
        });
        if (!resident) {
            throw Errors.throw(Errors.CustomBadRequest, ['resident not found']);
        }

        let visitor: IDB.Visitor = new IDB.Visitor();

        visitor.setValue('creator', data.user);
        visitor.setValue('community', _userInfo.community);
        visitor.setValue('resident', resident);
        visitor.setValue('name', _input.visitorName);
        visitor.setValue('visitorSrc', '');
        visitor.setValue('count', _input.visitorCount);
        visitor.setValue('purpose', _input.purpose);
        visitor.setValue('memo', _input.memo);
        visitor.setValue('notificateCount', 0);
        visitor.setValue('isDeleted', false);

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
                purpose: visitor.getValue('purpose'),
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
        permission: [RoleList.Chairman, RoleList.DeputyChairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral, RoleList.Guard, RoleList.Resident],
    },
    async (data): Promise<OutputR> => {
        let _input: InputR = data.inputType;
        let _userInfo = await Db.GetUserInfo(data);
        let _page: number = _input.page || 1;
        let _count: number = _input.count || 10;
        let _divideMinute: number = _input.divideMinute || 30;
        let _divideDate: Date = new Date();

        _divideDate = new Date(_divideDate.setMinutes(_divideDate.getMinutes() - _divideMinute));

        let query: Parse.Query<IDB.Visitor> = new Parse.Query(IDB.Visitor).equalTo('community', _userInfo.community).equalTo('isDeleted', false);
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

        if (_userInfo.resident) {
            query.equalTo('resident', _userInfo.resident);
        }

        let total: number = await query.count().catch((e) => {
            throw e;
        });

        let visitors: IDB.Visitor[] = await query
            .skip((_page - 1) * _count)
            .limit(_count)
            .include('resident')
            .find()
            .catch((e) => {
                throw e;
            });

        let tasks: Promise<any>[] = visitors.map((value, index, array) => {
            return new Parse.Query(IDB.CharacterResidentInfo)
                .equalTo('resident', value.getValue('resident'))
                .equalTo('isDeleted', false)
                .first();
        });
        let residentInfos: IDB.CharacterResidentInfo[] = await Promise.all(tasks).catch((e) => {
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
                    residentAddress: value.getValue('resident').getValue('address'),
                    name: value.getValue('name'),
                    visitorSrc: value.getValue('visitorSrc'),
                    count: value.getValue('count'),
                    purpose: value.getValue('purpose'),
                    memo: value.getValue('memo'),
                    notificateCount: value.getValue('notificateCount'),
                    status: _input.status,
                    leaveDate: value.getValue('leaveDate'),
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
        permission: [RoleList.Chairman, RoleList.DeputyChairman, RoleList.FinanceCommittee],
    },
    async (data): Promise<OutputD> => {
        let _input: InputD = data.inputType;
        let _userInfo = await Db.GetUserInfo(data);
        let _visitorIds: string[] = [].concat(data.parameters.visitorIds);

        _visitorIds = _visitorIds.filter((value, index, array) => {
            return array.indexOf(value) === index;
        });

        let tasks: Promise<any>[] = _visitorIds.map((value, index, array) => {
            return new Parse.Query(IDB.Visitor).get(value);
        });
        let visitors: IDB.Visitor[] = await Promise.all(tasks).catch((e) => {
            throw e;
        });

        tasks = visitors.map((value, index, array) => {
            value.setValue('isDeleted', true);

            return value.save(null, { useMasterKey: true });
        });
        await Promise.all(tasks).catch((e) => {
            throw e;
        });

        visitors.forEach((value, index, array) => {
            Notice.notice$.next({
                resident: value.getValue('resident'),
                type: Enum.MessageType.visitorDelete,
                data: value,
                message: {
                    visitor: value.getValue('name'),
                    purpose: value.getValue('purpose'),
                },
            });
        });

        return new Date();
    },
);
