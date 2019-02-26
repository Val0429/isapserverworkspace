import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, CharacterResident, PackageReturn } from '../../../custom/models';
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

type OutputC = IResponse.IPackage.IReturnIndexC;

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

        let packageReturn: PackageReturn = new PackageReturn();

        packageReturn.setValue('creator', data.user);
        packageReturn.setValue('resident', resident);
        packageReturn.setValue('sender', _input.sender);
        packageReturn.setValue('receiver', _input.receiver);
        packageReturn.setValue('barcode', _input.barcode);
        packageReturn.setValue('status', Enum.ReceiveStatus.unreceived);
        packageReturn.setValue('memo', _input.memo);
        packageReturn.setValue('notificateCount', 0);
        packageReturn.setValue('adjustReason', '');

        await packageReturn.save(null, { useMasterKey: true }).catch((e) => {
            throw e;
        });

        return {
            packageReturnId: packageReturn.id,
        };
    },
);

/**
 * Action Read
 */
type InputR = IRequest.IPackage.IReceiveIndexR & IRequest.IDataList;

type OutputR = IResponse.IDataList<IResponse.IPackage.IReturnIndexR[]>;

action.get(
    {
        inputType: 'InputR',
        permission: [RoleList.SystemAdministrator, RoleList.Administrator, RoleList.Chairman, RoleList.DeputyChairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral, RoleList.Guard],
    },
    async (data): Promise<OutputR> => {
        let _input: InputR = data.inputType;
        let _page: number = _input.page || 1;
        let _count: number = _input.count || 10;

        let query: Parse.Query<PackageReturn> = new Parse.Query(PackageReturn);
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

        let packageReturns: PackageReturn[] = await query
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
            content: packageReturns.map((value, index, array) => {
                return {
                    packageReturnId: value.id,
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
type InputU = IRequest.IPackage.IReturnIndexU;

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

        let packageReturn: PackageReturn = await new Parse.Query(PackageReturn).get(_input.packageReturnId).catch((e) => {
            throw e;
        });
        if (!packageReturn) {
            throw Errors.throw(Errors.CustomBadRequest, ['return not found']);
        }

        packageReturn.setValue('resident', resident);
        packageReturn.setValue('sender', _input.sender);
        packageReturn.setValue('receiver', _input.receiver);
        packageReturn.setValue('memo', _input.memo);
        packageReturn.setValue('adjustReason', _input.adjustReason);

        await packageReturn.save(null, { useMasterKey: true }).catch((e) => {
            throw e;
        });

        return '';
    },
);
