import { IUser, Action, Restful, RoleList, Errors, Socket, Config, Flow1Companies, Flow1Purposes } from 'core/cgi-package';
import { IFlow1WorkPermitAccessGroup as IWorkPermitAccessGroup } from 'workspace/custom/models/Flow1/crms/work-permit';
import { FRSService } from 'workspace/custom/services/frs-service';

let action = new Action({
    loginRequired: true,
    permission: [RoleList.Administrator],
});

export default action;

/**
 * Action Read
 */
type InputR = null;

type OutputR = IWorkPermitAccessGroup[];

action.get(
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;

            let frs = FRSService.sharedInstance();

            let groups = await frs.GetEntrances();

            return groups.map((value, index, array) => {
                return {
                    doorId: value.objectId,
                    doorName: value.name,
                };
            });
        } catch (e) {
            throw e;
        }
    },
);
