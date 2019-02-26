import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, PackagePosting, CharacterResident } from '../../../../custom/models';
import * as Enum from '../../../../custom/enums';

let action = new Action({
    loginRequired: true,
});

export default action;

/**
 * Action update
 */
type InputU = IRequest.IPackage.IPostingResidentReceive;

type OutputU = string;

action.put(
    {
        inputType: 'InputU',
        permission: [RoleList.SystemAdministrator, RoleList.Administrator, RoleList.DirectorGeneral, RoleList.Guard],
    },
    async (data): Promise<OutputU> => {
        let _input: InputU = data.inputType;

        let packagePosting: PackagePosting = await new Parse.Query(PackagePosting)
            .include('resident')
            .get(_input.packagePostingId)
            .catch((e) => {
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

        await packagePosting.save(null, { useMasterKey: true }).catch((e) => {
            throw e;
        });

        return '';
    },
);