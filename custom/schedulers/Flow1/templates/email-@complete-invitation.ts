import { DynamicLoader } from 'helpers/dynamic-loader/dynamic-loader';
import { ScheduleTemplateBase, ScheduleActionEmail } from 'models/schedulers/schedulers.base';
import { IFlow1InvitationDate } from 'core/events.gen';

function generateDateString(dates: IFlow1InvitationDate): string {
    return dates.map( (date) => {
        return `${date.start.toLocaleString()} to ${date.end.toLocaleString()}`;
    }).join("<BR />");
}

export interface IFlow1InputScheduleTemplateEmail_CompleteInvitation {
    visitor: {
        name: string;
        dates: IFlow1InvitationDate;
        pin: string;
    }
}

export class Flow1ScheduleTemplateEmail_CompleteInvitation extends ScheduleTemplateBase<
    ScheduleActionEmail,
    IFlow1InputScheduleTemplateEmail_CompleteInvitation
    > {

    constructor() {
        super();

        this.register( (input) => {
            let subject = `Invitation of Visitor ${input.visitor.name}`;

            let body = `
    <div style="color: #333; font-family: Calibri Light; font-size: 18;">
        <p>Hi ${input.visitor.name},</p>
        <p>Your QRCode for visiting date: <BR />${generateDateString(input.visitor.dates)}</p>
        <img src="cid:qrcode" />
        <p>PinCode: ${input.visitor.pin}</p>
    </div>
            `;

            return { subject, body };
        });
    }

}
