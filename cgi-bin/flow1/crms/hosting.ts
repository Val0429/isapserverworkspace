import { IUser, Action, Restful, RoleList, Errors, Socket, Config, Flow1Companies, Flow1Purposes, IFlow1InvitationDateUnit, FileHelper } from 'core/cgi-package';
import { Flow1WorkPermit as WorkPermit, IFlow1WorkPermitPerson as IWorkPermitPerson, IFlow1WorkPermitAccessGroup as IWorkPermitAccessGroup, EFlow1WorkPermitStatus as EWorkPermitStatus } from 'workspace/custom/models/Flow1/crms/work-permit';
import pinCode from 'services/pin-code';
import { Email, Utility, Regex } from './__api__';
import { QRCode } from 'services/qr-code';

type Companies = Flow1Companies;
let Companies = Flow1Companies;

type Purposes = Flow1Purposes;
let Purposes = Flow1Purposes;

let action = new Action({
    loginRequired: false,
    permission: [],
});

export default action;

/**
 * Action Read
 */
type InputR = null;

type OutputR = string;

action.get(
    {
        inputType: 'InputR',
    },
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;

            return Config.core.publicExternalIP;
        } catch (e) {
            throw e;
        }
    },
);
