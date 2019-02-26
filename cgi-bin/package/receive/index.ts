import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, CharacterResident, PackageReceive } from '../../../custom/models';
import * as Enum from '../../../custom/enums';
import { Draw, Parser, Print } from 'workspace/custom/helpers';

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
        permission: [RoleList.SystemAdministrator, RoleList.Administrator, RoleList.DirectorGeneral, RoleList.Guard],
    },
    async (data): Promise<OutputC> => {
        let _input: InputC = data.inputType;

        if (_input.barcode.length > 30) {
            throw Errors.throw(Errors.CustomBadRequest, ['barcode is too long']);
        }

        let resident: CharacterResident = await new Parse.Query(CharacterResident).get(_input.residentId).catch((e) => {
            throw e;
        });
        if (!resident) {
            throw Errors.throw(Errors.CustomBadRequest, ['resident not found']);
        }

        let receive: PackageReceive = new PackageReceive();

        receive.setValue('creator', data.user);
        receive.setValue('resident', resident);
        receive.setValue('sender', _input.sender);
        receive.setValue('receiver', _input.receiver);
        receive.setValue('barcode', _input.barcode);
        receive.setValue('status', Enum.ReceiveStatus.unreceived);
        receive.setValue('memo', _input.memo);
        receive.setValue('notificateCount', 0);
        receive.setValue('adjustReason', '');

        await receive.save(null, { useMasterKey: true }).catch((e) => {
            throw e;
        });

        return {
            packageReceiveId: receive.id,
        };
    },
);

/**
 * Action Read
 */
type InputR = IRequest.IPackage.IReceiveIndexR & IRequest.IDataList;

type OutputR = IResponse.IDataList<IResponse.IPackage.IReceiveIndexR[]>;

action.get(
    {
        inputType: 'InputR',
        permission: [RoleList.SystemAdministrator, RoleList.Administrator, RoleList.Chairman, RoleList.DeputyChairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral, RoleList.Guard],
    },
    async (data): Promise<OutputR> => {
        let _input: InputR = data.inputType;
        let _page: number = _input.page || 1;
        let _count: number = _input.count || 10;

        let query: Parse.Query<PackageReceive> = new Parse.Query(PackageReceive);
        if (_input.status !== null && _input.status !== undefined) {
            query.equalTo('status', _input.status);
        }
        if (_input.start) {
            query.greaterThanOrEqualTo('createdAt', _input.start);
        }
        if (_input.end) {
            query.lessThan('createdAt', new Date(new Date(new Date(_input.end).setDate(_input.end.getDate() + 1)).setHours(0, 0, 0, 0)));
        }

        let total: number = await query.count().catch((e) => {
            throw e;
        });

        let receives: PackageReceive[] = await query
            .skip((_page - 1) * _count)
            .limit(_count)
            .include('resident')
            .find()
            .catch((e) => {
                throw e;
            });

        return {
            total: total,
            page: _page,
            count: _count,
            content: receives.map((value, index, array) => {
                return {
                    packageReceiveId: value.id,
                    residentId: value.getValue('resident').id,
                    date: value.createdAt,
                    address: value.getValue('resident').getValue('address'),
                    sender: value.getValue('sender'),
                    receiver: value.getValue('receiver'),
                    barcode: Draw.Barcode(value.getValue('barcode'), 0.5, 25).toString(Parser.Encoding.base64),
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

type OutputU = string;

action.put(
    {
        inputType: 'InputU',
        permission: [RoleList.SystemAdministrator, RoleList.Administrator, RoleList.Chairman, RoleList.DeputyChairman, RoleList.DirectorGeneral],
    },
    async (data): Promise<OutputU> => {
        let _input: InputU = data.inputType;

        let resident: CharacterResident = await new Parse.Query(CharacterResident).get(_input.residentId).catch((e) => {
            throw e;
        });
        if (!resident) {
            throw Errors.throw(Errors.CustomBadRequest, ['resident not found']);
        }

        let receive: PackageReceive = await new Parse.Query(PackageReceive).get(_input.packageReceiveId).catch((e) => {
            throw e;
        });
        if (!receive) {
            throw Errors.throw(Errors.CustomBadRequest, ['receive not found']);
        }

        receive.setValue('resident', resident);
        receive.setValue('sender', _input.sender);
        receive.setValue('receiver', _input.receiver);
        receive.setValue('memo', _input.memo);
        receive.setValue('adjustReason', _input.adjustReason);

        await receive.save(null, { useMasterKey: true }).catch((e) => {
            throw e;
        });

        return '';
    },
);
