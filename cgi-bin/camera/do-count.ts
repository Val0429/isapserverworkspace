import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../custom/models';
import { PeopleCounting, Print } from '../../custom/helpers';
import * as Enum from '../../custom/enums';

let action = new Action({
    loginRequired: true,
    permission: [RoleList.Admin],
});

export default action;

/**
 * Action Read
 */
type InputR = IRequest.ICamera.IDoCount;

type OutputR = IResponse.ICamera.IDoCount;

action.get(
    { inputType: 'InputR' },
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;

            let hanwha: PeopleCounting.Hanwha = new PeopleCounting.Hanwha();
            hanwha.config = _input;

            hanwha.Initialization();

            let count: number = (await hanwha.GetDoSetting()).AlarmOutputs.length;

            return {
                count: count,
            };
        } catch (e) {
            Print.Log(new Error(JSON.stringify(e)), 'error');
            throw e;
        }
    },
);
