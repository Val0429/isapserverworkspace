import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import {} from '../../../custom/helpers';
import * as Enum from '../../../custom/enums';

let action = new Action({
    loginRequired: true,
    permission: [],
});

export default action;

/**
 * Action Read
 */
type InputR = null;

type OutputR = Date;

action.get(
    async (data): Promise<OutputR> => {
        let _input: InputR = data.inputType;

        return new Date();
    },
);
