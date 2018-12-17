import { Action, Errors, EventLogin, Events, UserHelper } from 'core/cgi-package';

let action = new Action({
    loginRequired: false,
    permission: [],
});

export default action;

/**
 * Action Login
 */
type Input = {
    username: string;
    password: string;
};
type Output = {
    sessionId: string;
    serverTime: Date;
};

action.post(
    { inputType: 'Input' },
    async (data): Promise<Output> => {
        let _input: Input = data.inputType;

        let _user: Parse.User = await new Parse.Query(Parse.User).equalTo('username', _input.username).first();
        if (!_user) {
            throw Errors.throw(Errors.CustomBadRequest, [`User <${_input.username}> not exists.`]);
        }

        let obj = await UserHelper.login(data.inputType);

        let event: EventLogin = new EventLogin({
            owner: _user,
        });
        await Events.save(event);

        return {
            sessionId: obj.sessionId,
            serverTime: new Date(),
        };
    },
);
