import { Action, Events, EventLogout } from 'core/cgi-package';
import { IRequest, IResponse } from '../../../custom/models';

let action = new Action({
    loginRequired: true,
    permission: [],
});

export default action;

/**
 * Action Logout
 */
type Input = IRequest.IUser.IBaseLogout;
type Output = string;

action.post(
    { inputType: 'Input' },
    async (data): Promise<Output> => {
        let _input: Input = data.inputType;

        await data.session.destroy({ sessionToken: _input.sessionId }).catch((e) => {
            throw e;
        });

        let event: EventLogout = new EventLogout({
            owner: data.user,
        });
        await Events.save(event).catch((e) => {
            throw e;
        });

        return '';
    },
);
