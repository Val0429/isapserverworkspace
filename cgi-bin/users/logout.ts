import { Action, Events, EventLogout } from 'core/cgi-package';

let action = new Action({
    loginRequired: true,
    permission: [],
});

export default action;

/**
 * Action Logout
 */
type Input = {
    sessionId: string;
};
type Output = string;

action.post(
    { inputType: 'Input' },
    async (data): Promise<Output> => {
        let _input: Input = data.inputType;

        await data.session.destroy({ sessionToken: _input.sessionId });

        let event: EventLogout = new EventLogout({
            owner: data.user,
        });
        await Events.save(event);

        return '';
    },
);
