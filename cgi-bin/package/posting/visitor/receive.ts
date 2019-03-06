import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, PackagePosting, MessageResident } from '../../../../custom/models';
import * as Enum from '../../../../custom/enums';
import { File } from 'workspace/custom/helpers';

let action = new Action({
    loginRequired: true,
});

export default action;

/**
 * Action update
 */
type InputU = IRequest.IPackage.IPostingVisitorReceive;

type OutputU = Date;

action.put(
    {
        inputType: 'InputU',
        postSizeLimit: 10000000,
        permission: [RoleList.SystemAdministrator, RoleList.Administrator, RoleList.DirectorGeneral, RoleList.Guard],
    },
    async (data): Promise<OutputU> => {
        let _input: InputU = data.inputType;

        let packagePosting: PackagePosting = await new Parse.Query(PackagePosting).get(_input.packagePostingId).catch((e) => {
            throw e;
        });
        if (!packagePosting) {
            throw Errors.throw(Errors.CustomBadRequest, ['package receive not found']);
        }
        if (packagePosting.getValue('status') === Enum.ReceiveStatus.received) {
            throw Errors.throw(Errors.CustomBadRequest, ['package was received']);
        }

        let receiverSrc: string = `images/${packagePosting.id}_receiver_${packagePosting.createdAt.getTime()}.png`;
        File.WriteBase64File(`${File.assetsPath}/${receiverSrc}`, _input.receiverImage);

        packagePosting.setValue('status', Enum.ReceiveStatus.received);
        packagePosting.setValue('memo', _input.memo);
        packagePosting.setValue('receiverSrc', receiverSrc);
        packagePosting.setValue('manager', data.user);

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
