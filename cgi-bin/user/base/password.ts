import { Action, Events, EventLogout } from 'core/cgi-package';
import { IRequest, IResponse } from '../../../custom/models';

let action = new Action({
    loginRequired: true,
    permission: [],
});

export default action;

/**
 * Action update
 */
type InputU = IRequest.IUser.IBasePasswordU;

type OutputU = string;

action.put(
    { inputType: 'InputU' },
    async (data): Promise<OutputU> => {
        let _input: InputU = data.inputType;
        let _userId: string = _input.userId || data.user.id;

        let user: Parse.User = await new Parse.Query(Parse.User).get(_userId).catch((e) => {
            throw e;
        });

        user = await Parse.User.logIn(user.getUsername(), _input.previous).catch((e) => {
            throw e;
        });

        user.setPassword(_input.current);
        await user.save(null, { useMasterKey: true }).catch((e) => {
            throw e;
        });

        return '';
    },
);
