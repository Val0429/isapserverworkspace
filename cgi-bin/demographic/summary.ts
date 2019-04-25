import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../custom/models';
import { Print } from '../../custom/helpers';
import * as Enum from '../../custom/enums';
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
        try {
            return await Demographic.GetSummary(data.inputType);
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
