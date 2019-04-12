import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Draw, Parser, Db } from '../../../custom/helpers';
import * as Enum from '../../../custom/enums';
import * as Notice from '../../../custom/services/notice';

let action = new Action({
    loginRequired: true,
});

export default action;

/**
 * Action Create
 */
type InputC = IRequest.IPackage.IReceiveIndexC;

type OutputC = IResponse.IPackage.IReceiveIndexC;

action.post(
    {
        inputType: 'InputC',
        permission: [RoleList.DirectorGeneral, RoleList.Guard],
    },
    async (data): Promise<OutputC> => {
        let _input: InputC = data.inputType;
        let _userInfo = await Db.GetUserInfo(data);

        if (_input.barcode.length > 30) {
            throw Errors.throw(Errors.CustomBadRequest, ['barcode is too long']);
        }

        let resident: IDB.CharacterResident = await new Parse.Query(IDB.CharacterResident).get(_input.residentId).fail((e) => {
            throw e;
        });
        if (!resident) {
            throw Errors.throw(Errors.CustomBadRequest, ['resident not found']);
        }

        let packageReceive: IDB.PackageReceive = new IDB.PackageReceive();

        packageReceive.setValue('creator', data.user);
        packageReceive.setValue('community', _userInfo.community);
        packageReceive.setValue('resident', resident);
        packageReceive.setValue('sender', _input.sender);
        packageReceive.setValue('receiver', _input.receiver);
        packageReceive.setValue('barcode', _input.barcode);
        packageReceive.setValue('status', Enum.ReceiveStatus.unreceived);
        packageReceive.setValue('memo', _input.memo);
        packageReceive.setValue('notificateCount', 0);
        packageReceive.setValue('adjustReason', '');

        await packageReceive.save(null, { useMasterKey: true }).fail((e) => {
            throw e;
        });

        Notice.notice$.next({
            resident: packageReceive.getValue('resident'),
            type: Enum.MessageType.packageReceiveNew,
            data: packageReceive,
            message: {
                address: packageReceive.getValue('resident').getValue('address'),
                receiver: packageReceive.getValue('receiver'),
            },
        });

        return {
            packageReceiveId: packageReceive.id,
        };
    },
);

/**
 * Action Read
 */
type InputR = IRequest.IDataList & IRequest.IPackage.IReceiveIndexR;

type OutputR = IResponse.IDataList<IResponse.IPackage.IReceiveIndexR[]>;

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

        let query: Parse.Query<IDB.PackageReceive> = new Parse.Query(IDB.PackageReceive).equalTo('community', _userInfo.community);
        if (_input.start) {
            query.greaterThanOrEqualTo('createdAt', new Date(new Date(_input.start).setHours(0, 0, 0, 0)));
        }
        if (_input.end) {
            query.lessThan('createdAt', new Date(new Date(new Date(_input.end).setDate(_input.end.getDate() + 1)).setHours(0, 0, 0, 0)));
        }
        if (_input.status === 'received') {
            query.equalTo('status', Enum.ReceiveStatus.received);
        } else if (_input.status === 'unreceived') {
            query.equalTo('status', Enum.ReceiveStatus.unreceived);
        }

        if (_userInfo.resident) {
            query.equalTo('resident', _userInfo.resident);
        }

        let total: number = await query.count().fail((e) => {
            throw e;
        });

        let packageReceives: IDB.PackageReceive[] = await query
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
            content: packageReceives.map((value, index, array) => {
                return {
                    packageReceiveId: value.id,
                    residentId: value.getValue('resident').id,
                    date: value.createdAt,
                    address: value.getValue('resident').getValue('address'),
                    sender: value.getValue('sender'),
                    receiver: value.getValue('receiver'),
                    barcode: Parser.Base64Str2HtmlSrc(Draw.Barcode(value.getValue('barcode'), 0.5, true, 25).toString(Parser.Encoding.base64)),
                    status: value.getValue('status'),
                    memo: value.getValue('memo'),
                    notificateCount: value.getValue('notificateCount'),
                    adjustReason: value.getValue('adjustReason'),
                };
            }),
        };
    },
);

/**
 * Action update
 */
type InputU = IRequest.IPackage.IReceiveIndexU;

type OutputU = Date;

action.put(
    {
        inputType: 'InputU',
        permission: [RoleList.Chairman, RoleList.DeputyChairman, RoleList.DirectorGeneral],
    },
    async (data): Promise<OutputU> => {
        let _input: InputU = data.inputType;
        let _userInfo = await Db.GetUserInfo(data);

        let resident: IDB.CharacterResident = await new Parse.Query(IDB.CharacterResident).get(_input.residentId).fail((e) => {
            throw e;
        });
        if (!resident) {
            throw Errors.throw(Errors.CustomBadRequest, ['resident not found']);
        }

        let packageReceive: IDB.PackageReceive = await new Parse.Query(IDB.PackageReceive).get(_input.packageReceiveId).fail((e) => {
            throw e;
        });
        if (!packageReceive) {
            throw Errors.throw(Errors.CustomBadRequest, ['receive not found']);
        }

        packageReceive.setValue('resident', resident);
        packageReceive.setValue('sender', _input.sender);
        packageReceive.setValue('receiver', _input.receiver);
        packageReceive.setValue('memo', _input.memo);
        packageReceive.setValue('adjustReason', _input.adjustReason);

        await packageReceive.save(null, { useMasterKey: true }).fail((e) => {
            throw e;
        });

        Notice.notice$.next({
            resident: packageReceive.getValue('resident'),
            type: Enum.MessageType.packageReceiveUpdate,
            data: packageReceive,
            message: {},
        });

        return new Date();
    },
);
