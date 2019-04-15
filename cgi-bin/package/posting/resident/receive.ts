import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../../../custom/models';
import { Db, Print } from '../../../../custom/helpers';
import * as Enum from '../../../../custom/enums';
import * as Notice from '../../../../custom/services/notice';

let action = new Action({
    loginRequired: true,
});

export default action;

/**
 * Action update
 */
type InputU = IRequest.IPackage.IPostingResidentReceive;

type OutputU = Date;

action.put(
    {
        inputType: 'InputU',
        permission: [RoleList.DirectorGeneral, RoleList.Guard],
    },
    async (data): Promise<OutputU> => {
        try {
            let _input: InputU = data.inputType;
            let _userInfo = await Db.GetUserInfo(data);

            let packagePosting: IDB.PackagePosting = await new Parse.Query(IDB.PackagePosting)
                .include('resident')
                .get(_input.packagePostingId)
                .fail((e) => {
                    throw e;
                });
            if (!packagePosting) {
                throw Errors.throw(Errors.CustomBadRequest, ['package receive not found']);
            }
            if (packagePosting.getValue('status') === Enum.ReceiveStatus.received) {
                throw Errors.throw(Errors.CustomBadRequest, ['package was received']);
            }
            if (packagePosting.getValue('resident').getValue('barcode') !== _input.residentBarcode) {
                throw Errors.throw(Errors.CustomBadRequest, ['resident barcode is error']);
            }

            packagePosting.setValue('status', Enum.ReceiveStatus.received);
            packagePosting.setValue('memo', _input.memo);
            packagePosting.setValue('manager', data.user);

            await packagePosting.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });

            Notice.notice$.next({
                resident: packagePosting.getValue('resident'),
                type: Enum.MessageType.packagePostingResidentReceive,
                data: packagePosting,
                message: {
                    address: packagePosting.getValue('resident').getValue('address'),
                    receiver: packagePosting.getValue('receiver'),
                },
            });

            return new Date();
        } catch (e) {
            Print.Log(new Error(JSON.stringify(e)), 'error');
            throw e;
        }
    },
);
