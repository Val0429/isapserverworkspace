import { Action, Errors, EventLogin, Events, UserHelper, ParseObject, RoleList } from 'core/cgi-package';
import { IRequest, IResponse } from '../../custom/models';

let action = new Action({
    loginRequired: false,
    permission: [],
});

export default action;

/**
 * Action Login
 */
type Input = IRequest.IUser.ILogin;
type Output = IResponse.IUser.ILogin;

action.post(
    { inputType: 'Input' },
    async (data): Promise<Output> => {
        let _input: Input = data.inputType;

        let user = await UserHelper.login(_input);

        let event: EventLogin = new EventLogin({
            owner: user.user,
        });
        await Events.save(event);

        return {
            sessionId: user.sessionId,
            objectId: user.user.id,
            roles: user.user.get('roles').map((value, index, array) => {
                return Object.keys(RoleList).find((value1, index1, array1) => {
                    return value.get('name') === RoleList[value1];
                });
            }),
            serverTime: new Date(),
        };
    },
);
