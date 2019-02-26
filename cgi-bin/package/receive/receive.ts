import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, PackageReceive, CharacterResident } from '../../../custom/models';
import * as Enum from '../../../custom/enums';

let action = new Action({
    loginRequired: true,
});

export default action;

/**
 * Action update
 */
type InputU = IRequest.IPackage.IReceiveReceive;

type OutputU = string;

action.put(
    {
        inputType: 'InputU',
        permission: [RoleList.SystemAdministrator, RoleList.Administrator, RoleList.DirectorGeneral, RoleList.Guard],
    },
    async (data): Promise<OutputU> => {
        let _input: InputU = data.inputType;

        let packageReceive: PackageReceive = await new Parse.Query(PackageReceive)
            .include('resident')
            .get(_input.packageReceiveId)
            .catch((e) => {
                throw e;
            });
        if (!packageReceive) {
            throw Errors.throw(Errors.CustomBadRequest, ['package receive not found']);
        }
        if (packageReceive.getValue('status') === Enum.ReceiveStatus.received) {
            throw Errors.throw(Errors.CustomBadRequest, ['package was received']);
        }
        if (packageReceive.getValue('barcode') !== _input.packageBarcode) {
            throw Errors.throw(Errors.CustomBadRequest, ['package receive barcode is error']);
        }
        if (packageReceive.getValue('resident').getValue('barcode') !== _input.residentBarcode) {
            throw Errors.throw(Errors.CustomBadRequest, ['resident barcode is error']);
        }

        packageReceive.setValue('status', Enum.ReceiveStatus.received);
        packageReceive.setValue('memo', _input.memo);

        await packageReceive.save(null, { useMasterKey: true }).catch((e) => {
            throw e;
        });

        return '';
    },
);
