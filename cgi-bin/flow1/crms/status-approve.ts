import { IUser, Action, Restful, RoleList, Errors, Socket, Config, ParseObject, IFlow1InvitationDate, IFlow1InvitationDateUnit, FileHelper, Flow1Visitors } from 'core/cgi-package';
import { Flow1WorkPermit as WorkPermit, EFlow1WorkPermitStatus as EWorkPermitStatus } from 'workspace/custom/models/Flow1/crms/work-permit';
import { DateTime } from './__api__';
import { SendEmail } from './';
import { QRCode } from 'services/qr-code';
import { doInvitation } from '../visitors/invites';

let action = new Action({
    loginRequired: true,
    permission: [RoleList.SystemAdministrator, RoleList.Administrator],
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
                .include(['company', 'workCategory'])
                .first()
                .fail((e) => {
                    throw e;
                });
            if (!work) {
                throw Errors.throw(Errors.CustomBadRequest, ['work permit not found']);
            }

            work.setValue('status', EWorkPermitStatus.approve);

            let company = work.getValue('company');

            let visitors: any = work.getValue('persons').map( (visitor) => {
                return new Flow1Visitors({
                    name: visitor.name,
                    idcard: {
                        idnumber: visitor.nric,
                        name: visitor.name,
                        birthdate: '',
                        images: []
                    },
                    company: company,
                    phone: visitor.phone
                });
            });

            let purpose = work.getValue('workCategory');

            let startDate: Date = work.getValue('workStartDate');
            let startTime: Date = work.getValue('workStartTime');
            let endDate: Date = work.getValue('workEndDate');
            let endTime: Date = work.getValue('workEndTime');

            let dates: IFlow1InvitationDateUnit[] = [];
            for (let i: number = startDate.getTime(); i <= endDate.getTime(); i += 86400000) {
                let date: Date = new Date(i);

                let start: Date = new Date(new Date(date).setHours(startTime.getHours(), startTime.getMinutes(), startTime.getSeconds(), startTime.getMilliseconds()));
                let end: Date = new Date(new Date(date).setHours(endTime.getHours(), endTime.getMinutes(), endTime.getSeconds(), endTime.getMilliseconds()));

                dates.push({
                    start: start,
                    end: end,
                });
            }

            let invitation = await doInvitation(
                {
                    ...data,
                    inputType: {
                        company,
                        visitors,
                        purpose,
                        dates: dates as any,
                    } as any,
                },
                work.getValue('ptwId'),
            );

            work.setValue('invitation', invitation);

            let qrcode: QRCode = new QRCode();

            let title: string = 'PTW Approval';
            let content: string = `
                <div style='font-family:Microsoft JhengHei UI; color: #444;'>
                    <h3>Dear ${work.getValue('contact')},</h3>
                    <h4>One Raffles Link has approved your PTW request for:</h4>
                    <h4>Conducting “${work.getValue('workCategory').getValue('name')}” at “${work.getValue('workLocation')}” for “${work.getValue('company').getValue('name')}”</h4>
                    <h4>From “${DateTime.ToString(work.getValue('workStartDate'), 'MMMM Do YYYY')}” to “${DateTime.ToString(work.getValue('workEndDate'), 'MMMM Do YYYY')}” between “${DateTime.ToString(work.getValue('workStartTime'), 'HH:mm')}” and “${DateTime.ToString(work.getValue('workEndTime'), 'HH:mm')}”</h4>
                    <h4>On the day of your visit, please remember to bring this QR code</h4>
                    <img src="${FileHelper.getURL(await qrcode.make(`PTW # ${work.getValue('ptwId')}`), data)}" />
                </div>`;

            await SendEmail(title, content, [work.getValue('contractorCompanyEmail')], [work.getValue('contactEmail')]);

            await work.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });

            return new Date();
        } catch (e) {
            throw e;
        }
    },
);
