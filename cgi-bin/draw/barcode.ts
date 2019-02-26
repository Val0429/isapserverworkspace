import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse } from '../../custom/models';
import { Draw, Parser } from '../../custom/helpers';

let action = new Action({
    loginRequired: false,
    permission: [],
});

export default action;

/**
 * Action Read
 */
type InputR = string;

type OutputR = string;

action.get(
    '/:message',
    async (data): Promise<OutputR> => {
        return Draw.Barcode(data.parameters.message, 0.5, 25).toString(Parser.Encoding.base64);
    },
);
