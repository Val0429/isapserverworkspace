import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, CharacterResident, PackagePosting } from '../../../../custom/models';
import * as Enum from '../../../../custom/enums';
import { File } from 'workspace/custom/helpers';

let action = new Action({
    loginRequired: true,
});

export default action;

/**
 * Action Create
 */
type InputC = IRequest.IPackage.IPostingVisitorC;

type OutputC = IResponse.IPackage.IPostingIndexC;

action.post(
    {
        inputType: 'InputC',
        postSizeLimit: 10000000,
        permission: [RoleList.SystemAdministrator, RoleList.Administrator, RoleList.DirectorGeneral, RoleList.Guard],
    },
    async (data): Promise<OutputC> => {
        let _input: InputC = data.inputType;

        let resident: CharacterResident = await new Parse.Query(CharacterResident).get(_input.residentId).catch((e) => {
            throw e;
        });
        if (!resident) {
            throw Errors.throw(Errors.CustomBadRequest, ['resident not found']);
        }

        let packagePosting: PackagePosting = new PackagePosting();

        packagePosting.setValue('creator', data.user);
        packagePosting.setValue('resident', resident);
        packagePosting.setValue('sender', _input.sender);
        packagePosting.setValue('receiver', _input.receiver);
        packagePosting.setValue('status', Enum.ReceiveStatus.unreceived);
        packagePosting.setValue('memo', _input.memo);
        packagePosting.setValue('notificateCount', 0);
        packagePosting.setValue('adjustReason', '');
        packagePosting.setValue('receiverSrc', '');
        packagePosting.setValue('packageSrc', '');
        packagePosting.setValue('senderSrc', '');

        await packagePosting.save(null, { useMasterKey: true }).catch((e) => {
            throw e;
        });

        let packageSrc: string = `images/${packagePosting.id}_package_${packagePosting.createdAt.getTime()}.png`;
        File.WriteBase64Image(`${File.assetsPath}/${packageSrc}`, _input.packageImage);

        let senderSrc: string = `images/${packagePosting.id}_sender_${packagePosting.createdAt.getTime()}.png`;
        File.WriteBase64Image(`${File.assetsPath}/${senderSrc}`, _input.senderImage);

        packagePosting.setValue('packageSrc', packageSrc);
        packagePosting.setValue('senderSrc', senderSrc);

        await packagePosting.save(null, { useMasterKey: true }).catch((e) => {
            throw e;
        });

        return {
            packagePostingId: packagePosting.id,
        };
    },
);
