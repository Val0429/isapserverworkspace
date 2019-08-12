import { IUser, Action, Restful, RoleList, Errors, Socket, Config, ParseObject } from 'core/cgi-package';
import { WorkPermit, IWorkPermitPerson, IWorkPermitAccessGroup, EWorkPermitStatus } from 'workspace/custom/models';
import { DateTime } from './__api__';
import { SendEmail } from './';
import { QRCode } from 'services/qr-code';

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
                .include('company')
                .first()
                .fail((e) => {
                    throw e;
                });
            if (!work) {
                throw Errors.throw(Errors.CustomBadRequest, ['work permit not found']);
            }

            let qrcode: QRCode = new QRCode();

            let title: string = 'PTW Approval';
            let content: string = `
                <div style='font-family:Microsoft JhengHei UI; color: #444;'>
                    <h3>Dear ${work.getValue('contact')},</h3>
                    <h4>One Raffles Link has approved your PTW request for:</h4>
                    <h4>Conducting “${work.getValue('workCategory')}” at “${work.getValue('workLocation')}” for “${work.getValue('company').getValue('name')}”</h4>
                    <h4>From “${DateTime.ToString(work.getValue('workStartDate'), 'MMMM Do YYYY')}” to “${DateTime.ToString(work.getValue('workEndDate'), 'MMMM Do YYYY')}” between “${DateTime.ToString(work.getValue('workStartTime'), 'HH:mm')}” and “${DateTime.ToString(work.getValue('workEndTime'), 'HH:mm')}”</h4>
                    <h4>On the day of your visit, please remember to bring this QR code</h4>
                    <img src="${(await qrcode.make(`PTW # ${work.getValue('ptwId')}`)).url()}" />
                </div>`;

            await SendEmail(title, content, [work.getValue('contactEmail')]);

            work.setValue('status', EWorkPermitStatus.approve);

            await work.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });

            return new Date();
        } catch (e) {
            throw e;
        }
    },
);