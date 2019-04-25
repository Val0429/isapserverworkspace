import { Action, Events, EventLogout } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print } from '../../../custom/helpers';
import * as Enum from '../../../custom/enums';

let action = new Action({
    loginRequired: true,
    permission: [],
});

export default action;

/**
 * Action Logout
 */
type InputC = IRequest.IUser.IBaseLogout;

type OutputC = Date;

action.post(
    { inputType: 'InputC' },
    async (data): Promise<OutputC> => {
        try {
            let _input: InputC = data.inputType;

            await data.session.destroy({ sessionToken: _input.sessionId }).catch((e) => {
                throw e;
            });

            let event: EventLogout = new EventLogout({
                owner: data.user,
            });
            await Events.save(event).catch((e) => {
                throw e;
            });

            return new Date();
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
