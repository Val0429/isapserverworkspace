import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../custom/models';
import {} from '../../custom/helpers';
import * as Enum from '../../custom/enums';
import * as FaceCount from '.';

let action = new Action({
    loginRequired: false,
    permission: [],
});

export default action;

/**
 * Action Read
 */
type InputR = IRequest.IFaceCount.ISummaryR;

type OutputR = IResponse.IFaceCount.ISummaryR[];

action.get(
    { inputType: 'InputR' },
    async (data): Promise<OutputR> => {
        return await FaceCount.GetSummary(data.inputType);
    },
);
