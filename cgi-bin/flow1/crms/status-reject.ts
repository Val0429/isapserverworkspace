import { IUser, Action, Restful, RoleList, Errors, Socket, Config, ParseObject } from 'core/cgi-package';
import { WorkPermit, IWorkPermitPerson, IWorkPermitAccessGroup, EWorkPermitStatus } from 'workspace/custom/models/Flow1/crms/work-permit';
import { SendEmail } from './';

let action = new Action({
    loginRequired: true,
    permission: [RoleList.Administrator],
});

export default action;

/**
 * Action update
 */
type InputU = {
    objectId: string;
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
                .equalTo('objectId', _input.objectId)
                .first()
                .fail((e) => {
                    throw e;
                });
            if (!work) {
                throw Errors.throw(Errors.CustomBadRequest, ['work permit not found']);
            }

            let title: string = 'PTW Reject';
            let content: string = `
                <div style='font-family:Microsoft JhengHei UI; color: #444;'>
                    <h3>Dear ${work.getValue('contact')},</h3>
                    <h4>We’re sorry to inform you that One Raffles Link has REJECTED your PTW (PTW ID #${work.getValue('ptwId')}) request.</h4>
                </div>`;

            await SendEmail(title, content, [work.getValue('contactEmail')]);

            work.setValue('status', EWorkPermitStatus.reject);

            await work.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });

            return new Date();
        } catch (e) {
            throw e;
        }
    },
);
