import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../custom/models';
import { Db, Print } from '../../custom/helpers';
import * as Enum from '../../custom/enums';
import * as Notice from '../../custom/services/notice';

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
        permission: [RoleList.Chairman, RoleList.DeputyChairman, RoleList.FinanceCommittee],
    },
    async (data): Promise<OutputU> => {
        try {
            let _input: InputU = data.inputType;
            let _userInfo = await Db.GetUserInfo(data);

            let listen: IDB.Listen = await new Parse.Query(IDB.Listen).get(_input.listenId).fail((e) => {
                throw e;
            });
            if (!listen) {
                throw Errors.throw(Errors.CustomBadRequest, ['listen not found']);
            }
            if (listen.getValue('isDeleted')) {
                throw Errors.throw(Errors.CustomBadRequest, ['listen was deleted']);
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

            await listen.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });

            Notice.notice$.next({
                resident: listen.getValue('resident'),
                type: Enum.MessageType.listenReceive,
                data: listen,
                message: {
                    title: listen.getValue('title'),
                    content: _input.replyContent,
                },
            });

            return new Date();
        } catch (e) {
            Print.Log(new Error(JSON.stringify(e)), 'error');
            throw e;
        }
    },
);
