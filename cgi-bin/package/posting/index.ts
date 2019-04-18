import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Db, Print } from '../../../custom/helpers';
import * as Enum from '../../../custom/enums';
import * as Notice from '../../../custom/services/notice';

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
        permission: [RoleList.Chairman, RoleList.DeputyChairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral, RoleList.Guard, RoleList.Resident],
    },
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;
            let _userInfo = await Db.GetUserInfo(data);
            let _page: number = _input.page || 1;
            let _count: number = _input.count || 10;

            let query: Parse.Query<IDB.PackagePosting> = new Parse.Query(IDB.PackagePosting).equalTo('community', _userInfo.community);
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

            let packagePostings: IDB.PackagePosting[] = await query
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
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
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
        permission: [RoleList.Chairman, RoleList.DirectorGeneral],
    },
    async (data): Promise<OutputU> => {
        try {
            let _input: InputU = data.inputType;
            let _userInfo = await Db.GetUserInfo(data);

            let resident: IDB.CharacterResident = await new Parse.Query(IDB.CharacterResident).get(_input.residentId).fail((e) => {
                throw e;
            });
            if (!resident) {
                throw Errors.throw(Errors.CustomBadRequest, ['resident not found']);
            }

            let packagePosting: IDB.PackagePosting = await new Parse.Query(IDB.PackagePosting).get(_input.packagePostingId).fail((e) => {
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

            await packagePosting.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });

            Notice.notice$.next({
                resident: packagePosting.getValue('resident'),
                type: Enum.MessageType.packagePostingUpdate,
                data: packagePosting,
                message: {},
            });

            return new Date();
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
