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
        return Parser.Base64Str2HtmlSrc(Draw.Barcode(data.parameters.message, 0.5, false, 25).toString(Parser.Encoding.base64));
    },
);
