import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse } from '../../custom/models';
import * as Demographic from '.';

let action = new Action({
    loginRequired: false,
    permission: [],
});

export default action;

/**
 * Action Read
 */
type InputR = IRequest.IDemographic.ISummaryR;

type OutputR = IResponse.IDemographic.ISummaryR[];

action.get(
    { inputType: 'InputR' },
    async (data): Promise<OutputR> => {
        return await Demographic.GetSummary(data.inputType);
    },
);
