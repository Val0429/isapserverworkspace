import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../../../custom/models';
import { File, Db, Print } from '../../../../custom/helpers';
import * as Enum from '../../../../custom/enums';
import * as Notice from '../../../../custom/services/notice';

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

            let receiverSrc: string = `images/${packagePosting.id}_receiver_${packagePosting.createdAt.getTime()}.png`;
            File.WriteBase64File(`${File.assetsPath}/${receiverSrc}`, _input.receiverImage);

            packagePosting.setValue('status', Enum.ReceiveStatus.received);
            packagePosting.setValue('memo', _input.memo);
            packagePosting.setValue('receiverSrc', receiverSrc);
            packagePosting.setValue('manager', data.user);

            await packagePosting.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });

            Notice.notice$.next({
                resident: packagePosting.getValue('resident'),
                type: Enum.MessageType.packagePostingVisitorReceive,
                data: packagePosting,
                message: {
                    address: packagePosting.getValue('resident').getValue('address'),
                    sender: packagePosting.getValue('sender'),
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
