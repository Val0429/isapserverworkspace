import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, PackageReceive, CharacterResident } from '../../../custom/models';
import * as Enum from '../../../custom/enums';

let action = new Action({
    loginRequired: true,
    permission: [RoleList.SystemAdministrator, RoleList.Administrator, RoleList.Chairman, RoleList.DeputyChairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral, RoleList.Guard],
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
        permission: [RoleList.SystemAdministrator, RoleList.Administrator, RoleList.Chairman, RoleList.DeputyChairman, RoleList.DirectorGeneral],
    },
    async (data): Promise<OutputU> => {
        let _input: InputU = data.inputType;

        let receive: PackageReceive = await new Parse.Query(PackageReceive)
            .include('resident')
            .get(_input.packageReceiveId)
            .catch((e) => {
                throw e;
            });
        if (!receive) {
            throw Errors.throw(Errors.CustomBadRequest, ['package receive not found']);
        }
        if (receive.getValue('barcode') !== _input.packageReceiveBarcode) {
            throw Errors.throw(Errors.CustomBadRequest, ['package receive barcode is error']);
        }
        if (receive.getValue('resident').getValue('barcode') !== _input.residentBarcode) {
            throw Errors.throw(Errors.CustomBadRequest, ['resident barcode is error']);
        }

        receive.setValue('status', Enum.ReceiveStatus.received);
        receive.setValue('memo', _input.memo);

        await receive.save(null, { useMasterKey: true }).catch((e) => {
            throw e;
        });

        return '';
    },
);
