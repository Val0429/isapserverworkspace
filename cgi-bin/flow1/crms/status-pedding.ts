import { IUser, Action, Restful, RoleList, Errors, Socket, Config, ParseObject } from 'core/cgi-package';
import { Flow1WorkPermit as WorkPermit, EFlow1WorkPermitStatus as EWorkPermitStatus } from 'workspace/custom/models/Flow1/crms/work-permit';
import { SendEmail } from './';

let action = new Action({
    loginRequired: false,
    permission: [],
});

export default action;

/**
 * Action update
 */
type InputU = {
    verify: string;
};

type OutputU = Date;

action.put(
    {
        inputType: 'InputU',
    },
    async (data): Promise<OutputU> => {
        try {
            let _input: InputU = data.inputType;

            let work: WorkPermit = await new Parse.Query(WorkPermit)
                .equalTo('verify', _input.verify)
                .include('creator')
                .first()
                .fail((e) => {
                    throw e;
                });
            if (!work) {
                throw Errors.throw(Errors.CustomBadRequest, ['work permit not found']);
            }

            let title: string = 'PTW has been submitted';
            let content: string = `
                <div style='font-family:Microsoft JhengHei UI; color: #444;'>
                    <h3>Hi,</h3>
                    <h4>Contractor “${work.getValue('workCategory')}” has submitted PTW # ${work.getValue('ptwId')}.</h4>
                    <h4>Please remember to review it, and approve / reject it accordingly.</h4>
                </div>`;

            await SendEmail(title, content, [work.getValue('creator').getEmail()]);

            work.setValue('status', EWorkPermitStatus.pendding);
            work.unset('verify');

            await work.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });

            return new Date();
        } catch (e) {
            throw e;
        }
    },
);
