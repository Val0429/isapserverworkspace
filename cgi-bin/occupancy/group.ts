import { IUser, Action, Restful, RoleList, Errors, Parse } from 'core/cgi-package';
import { IRequest, IResponse } from '../../custom/models';
import * as Occupancy from '.';

let action = new Action({
    loginRequired: false,
    permission: [],
});

export default action;

/**
 * Action Read
 */
type InputR = IRequest.IOccupancy.IGroupR;

type OutputR = IResponse.IOccupancy.IGroupR[];

action.get(
    { inputType: 'InputR' },
    async (data): Promise<OutputR> => {
        return await Occupancy.GetGroup(data.inputType);
    },
);
