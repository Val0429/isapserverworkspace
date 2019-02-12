import { IUser, Action, Restful, RoleList, Errors, Parse } from 'core/cgi-package';
import { IRequest, IResponse } from '../../custom/models';
import * as FaceCount from '.';

let action = new Action({
    loginRequired: false,
    permission: [],
});

export default action;

/**
 * Action Read
 */
type InputR = IRequest.IFaceCount.IGroupR;

type OutputR = IResponse.IFaceCount.IGroupR[];

action.get(
    { inputType: 'InputR' },
    async (data): Promise<OutputR> => {
        return await FaceCount.GetGroup(data.inputType);
    },
);
