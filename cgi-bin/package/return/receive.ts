import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, PackageReturn, MessageResident } from '../../../custom/models';
import * as Enum from '../../../custom/enums';

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
        permission: [RoleList.SystemAdministrator, RoleList.Administrator, RoleList.DirectorGeneral, RoleList.Guard],
    },
    async (data): Promise<OutputU> => {
        let _input: InputU = data.inputType;

        let packageReturn: PackageReturn = await new Parse.Query(PackageReturn)
            .include('resident')
            .get(_input.packageReturnId)
            .catch((e) => {
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
        if (packageReturn.getValue('resident').getValue('barcode') !== _input.residentBarcode) {
            throw Errors.throw(Errors.CustomBadRequest, ['resident barcode is error']);
        }

        packageReturn.setValue('status', Enum.ReceiveStatus.received);
        packageReturn.setValue('memo', _input.memo);
        packageReturn.setValue('manager', data.user);

        await packageReturn.save(null, { useMasterKey: true }).catch((e) => {
            throw e;
        });

        let message: MessageResident = new MessageResident();

        message.setValue('resident', packageReturn.getValue('resident'));
        message.setValue('packageReturn', packageReturn);

        await message.save(null, { useMasterKey: true }).catch((e) => {
            throw e;
        });

        return new Date();
    },
);
