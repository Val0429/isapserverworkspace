import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Draw, Parser, Db, Print } from '../../../custom/helpers';
import * as Enum from '../../../custom/enums';
import Notice from '../../../custom/actions/notice';

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
        permission: [RoleList.DirectorGeneral, RoleList.Guard],
    },
    async (data): Promise<OutputC> => {
        try {
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

            let packageReturn: IDB.PackageReturn = new IDB.PackageReturn();

            packageReturn.setValue('creator', data.user);
            packageReturn.setValue('community', _userInfo.community);
            packageReturn.setValue('resident', resident);
            packageReturn.setValue('sender', _input.sender);
            packageReturn.setValue('receiver', _input.receiver);
            packageReturn.setValue('barcode', _input.barcode);
            packageReturn.setValue('status', Enum.ReceiveStatus.unreceived);
            packageReturn.setValue('memo', _input.memo);
            packageReturn.setValue('notificateCount', 0);
            packageReturn.setValue('adjustReason', '');
            packageReturn.setValue('receiverSrc', '');

            await packageReturn.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });

            Notice.notice$.next({
                resident: packageReturn.getValue('resident'),
                type: Enum.MessageType.packageReturnNew,
                data: packageReturn,
                message: {},
            });

            return {
                packageReturnId: packageReturn.id,
            };
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);

/**
 * Action Read
 */
type InputR = IRequest.IDataList & IRequest.IPackage.IReceiveIndexR;

type OutputR = IResponse.IDataList<IResponse.IPackage.IReturnIndexR[]>;

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

            let query: Parse.Query<IDB.PackageReturn> = new Parse.Query(IDB.PackageReturn).equalTo('community', _userInfo.community);
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

            let packageReturns: IDB.PackageReturn[] = await query
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
                content: packageReturns.map((value, index, array) => {
                    return {
                        packageReturnId: value.id,
                        residentId: value.getValue('resident').id,
                        date: value.createdAt,
                        address: value.getValue('resident').getValue('address'),
                        sender: value.getValue('sender'),
                        receiver: value.getValue('receiver'),
                        barcode: value.getValue('barcode'),
                        barcodeSrc: Parser.Base64Str2HtmlSrc(Draw.Barcode(value.getValue('barcode'), 0.5, true, 25).toString(Parser.Encoding.base64)),
                        status: value.getValue('status'),
                        memo: value.getValue('memo'),
                        notificateCount: value.getValue('notificateCount'),
                        adjustReason: value.getValue('adjustReason'),
                        receiverSrc: value.getValue('receiverSrc'),
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
type InputU = IRequest.IPackage.IReturnIndexU;

type OutputU = Date;

action.put(
    {
        inputType: 'InputU',
        permission: [RoleList.Chairman, RoleList.DeputyChairman, RoleList.DirectorGeneral],
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

            let packageReturn: IDB.PackageReturn = await new Parse.Query(IDB.PackageReturn).get(_input.packageReturnId).fail((e) => {
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

            await packageReturn.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });

            Notice.notice$.next({
                resident: packageReturn.getValue('resident'),
                type: Enum.MessageType.packageReturnUpdate,
                data: packageReturn,
                message: {},
            });

            return new Date();
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
