import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, CharacterResident, PackagePosting, MessageResident } from '../../../custom/models';
import * as Enum from '../../../custom/enums';
import { Draw, Parser, Print } from 'workspace/custom/helpers';

let action = new Action({
    loginRequired: true,
});

export default action;

/**
 * Action Read
 */
type InputR = IRequest.IDataList & IRequest.IPackage.IReceiveIndexR;

type OutputR = IResponse.IDataList<IResponse.IPackage.IPostingIndexR[]>;

action.get(
    {
        inputType: 'InputR',
        permission: [RoleList.SystemAdministrator, RoleList.Administrator, RoleList.Chairman, RoleList.DeputyChairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral, RoleList.Guard],
    },
    async (data): Promise<OutputR> => {
        let _input: InputR = data.inputType;
        let _page: number = _input.page || 1;
        let _count: number = _input.count || 10;

        let query: Parse.Query<PackagePosting> = new Parse.Query(PackagePosting);
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

        let total: number = await query.count().catch((e) => {
            throw e;
        });

        let packagePostings: PackagePosting[] = await query
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
            content: packagePostings.map((value, index, array) => {
                return {
                    packagePostingId: value.id,
                    residentId: value.getValue('resident').id,
                    date: value.createdAt,
                    address: value.getValue('resident').getValue('address'),
                    sender: value.getValue('sender'),
                    receiver: value.getValue('receiver'),
                    status: value.getValue('status'),
                    memo: value.getValue('memo'),
                    notificateCount: value.getValue('notificateCount'),
                    adjustReason: value.getValue('adjustReason'),
                    packageSrc: value.getValue('packageSrc'),
                    senderSrc: value.getValue('senderSrc'),
                };
            }),
        };
    },
);

/**
 * Action update
 */
type InputU = IRequest.IPackage.IPostingIndexU;

type OutputU = Date;

action.put(
    {
        inputType: 'InputU',
        permission: [RoleList.SystemAdministrator, RoleList.Administrator, RoleList.Chairman, RoleList.DirectorGeneral],
    },
    async (data): Promise<OutputU> => {
        let _input: InputU = data.inputType;

        let resident: CharacterResident = await new Parse.Query(CharacterResident).get(_input.residentId).catch((e) => {
            throw e;
        });
        if (!resident) {
            throw Errors.throw(Errors.CustomBadRequest, ['resident not found']);
        }

        let packagePosting: PackagePosting = await new Parse.Query(PackagePosting).get(_input.packagePostingId).catch((e) => {
            throw e;
        });
        if (!packagePosting) {
            throw Errors.throw(Errors.CustomBadRequest, ['return not found']);
        }

        packagePosting.setValue('resident', resident);
        packagePosting.setValue('sender', _input.sender);
        packagePosting.setValue('receiver', _input.receiver);
        packagePosting.setValue('memo', _input.memo);
        packagePosting.setValue('adjustReason', _input.adjustReason);

        await packagePosting.save(null, { useMasterKey: true }).catch((e) => {
            throw e;
        });

        let message: MessageResident = new MessageResident();

        message.setValue('resident', packagePosting.getValue('resident'));
        message.setValue('packagePosting', packagePosting);

        await message.save(null, { useMasterKey: true }).catch((e) => {
            throw e;
        });

        return new Date();
    },
);
