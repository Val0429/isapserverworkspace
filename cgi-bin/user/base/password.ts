import { Action, Events, EventLogout } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import {} from '../../../custom/helpers';
import * as Enum from '../../../custom/enums';

let action = new Action({
    loginRequired: true,
    permission: [],
});

export default action;

/**
 * Action update
 */
type InputU = IRequest.IUser.IBasePasswordU;

type OutputU = Date;

action.put(
    { inputType: 'InputU' },
    async (data): Promise<OutputU> => {
        let _input: InputU = data.inputType;
        let _userId: string = _input.userId || data.user.id;

        let user: Parse.User = await new Parse.Query(Parse.User).get(_userId).fail((e) => {
            throw e;
        });

        user = await Parse.User.logIn(user.getUsername(), _input.previous).fail((e) => {
            throw e;
        });

        user.setPassword(_input.current);
        await user.save(null, { useMasterKey: true }).fail((e) => {
            throw e;
        });

        return new Date();
    },
);
