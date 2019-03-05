import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, Listen, MessageResident } from '../../custom/models';
import {} from '../../custom/helpers';
import * as Enum from '../../custom/enums';

let action = new Action({
    loginRequired: true,
});

export default action;

/**
 * Action update
 */
type InputU = IRequest.IListen.IReceive;

type OutputU = Date;

action.put(
    {
        inputType: 'InputU',
        permission: [RoleList.SystemAdministrator, RoleList.Administrator, RoleList.Chairman, RoleList.DeputyChairman, RoleList.FinanceCommittee],
    },
    async (data): Promise<OutputU> => {
        let _input: InputU = data.inputType;

        let listen: Listen = await new Parse.Query(Listen).get(_input.listenId).catch((e) => {
            throw e;
        });
        if (!listen) {
            throw Errors.throw(Errors.CustomBadRequest, ['listen not found']);
        }

        listen.setValue(
            'replys',
            listen.getValue('replys').concat({
                replier: data.user,
                content: _input.replyContent,
                date: new Date(),
            }),
        );
        listen.setValue('status', Enum.ReceiveStatus.received);

        await listen.save(null, { useMasterKey: true }).catch((e) => {
            throw e;
        });

        let message: MessageResident = new MessageResident();

        message.setValue('resident', listen.getValue('resident'));
        message.setValue('listen', listen);

        await message.save(null, { useMasterKey: true }).catch((e) => {
            throw e;
        });

        return new Date();
    },
);
