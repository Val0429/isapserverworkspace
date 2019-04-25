import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../custom/models';
import { Print } from '../../custom/helpers';
import * as Enum from '../../custom/enums';
import * as Occupancy from '.';

let action = new Action({
    loginRequired: false,
    permission: [],
});

export default action;

/**
 * Action Read
 */
type InputR = IRequest.IOccupancy.ISummaryR;

type OutputR = IResponse.IOccupancy.ISummaryR[];

action.get(
    { inputType: 'InputR' },
    async (data): Promise<OutputR> => {
        try {
            return await Occupancy.GetSummary(data.inputType);
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
