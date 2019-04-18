import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { File, Db, Print } from '../../../custom/helpers';
import * as Enum from '../../../custom/enums';
import * as Notice from '../../../custom/services/notice';

let action = new Action({
    loginRequired: true,
});

export default action;

/**
 * Action update
 */
type InputU = IRequest.IPackage.IReturnReceive;

type OutputU = Date;

action.put(
    {
        inputType: 'InputU',
        postSizeLimit: 10000000,
        permission: [RoleList.DirectorGeneral, RoleList.Guard],
    },
    async (data): Promise<OutputU> => {
        try {
            let _input: InputU = data.inputType;
            let _userInfo = await Db.GetUserInfo(data);

            let packageReturn: IDB.PackageReturn = await new Parse.Query(IDB.PackageReturn)
                .include('resident')
                .get(_input.packageReturnId)
                .fail((e) => {
                    throw e;
                });
            if (!packageReturn) {
                throw Errors.throw(Errors.CustomBadRequest, ['package return not found']);
            }
            if (packageReturn.getValue('status') === Enum.ReceiveStatus.received) {
                throw Errors.throw(Errors.CustomBadRequest, ['package was received']);
            }
            if (packageReturn.getValue('barcode') !== _input.packageBarcode) {
                throw Errors.throw(Errors.CustomBadRequest, ['package return barcode is error']);
            }

            let receiverSrc: string = `images/${packageReturn.id}_receiver_${packageReturn.createdAt.getTime()}.png`;
            File.WriteBase64File(`${File.assetsPath}/${receiverSrc}`, _input.receiverImage);

            packageReturn.setValue('status', Enum.ReceiveStatus.received);
            packageReturn.setValue('memo', _input.memo);
            packageReturn.setValue('manager', data.user);
            packageReturn.setValue('receiverSrc', receiverSrc);

            await packageReturn.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });

            Notice.notice$.next({
                resident: packageReturn.getValue('resident'),
                type: Enum.MessageType.packageReturnReceive,
                data: packageReturn,
                message: {
                    address: packageReturn.getValue('resident').getValue('address'),
                    sender: packageReturn.getValue('sender'),
                },
            });

            return new Date();
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
