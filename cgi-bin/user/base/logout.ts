import { Action, Events, EventLogout } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, Db } from '../../../custom/helpers';
import * as Enum from '../../../custom/enums';

let action = new Action({
    loginRequired: true,
});

export default action;

/**
 * Action Logout
 */
type InputC = IRequest.IUser.IBaseLogout;

type OutputC = Date;

action.post(
    {
        inputType: 'InputC',
        permission: [],
    },
    async (data): Promise<OutputC> => {
        try {
            let _input: InputC = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);

            await data.session.destroy({ sessionToken: _input.sessionId }).fail((e) => {
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

/**
 * Action Logout
 */
type InputR = IRequest.IUser.IBaseLogout;

type OutputR = Date;

action.get(
    {
        inputType: 'InputR',
        permission: [],
    },
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);

            await data.session.destroy({ sessionToken: _input.sessionId }).fail((e) => {
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
