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
 * Action update
 */
type InputU = IRequest.IUser.IBasePasswordU;

type OutputU = Date;

action.put(
    { inputType: 'InputU' },
    async (data): Promise<OutputU> => {
        try {
            let _input: InputU = data.inputType;
            let _userId: string = _input.objectId || data.user.id;

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

            return new Date();
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
