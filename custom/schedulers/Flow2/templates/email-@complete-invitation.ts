import { DynamicLoader } from 'helpers/dynamic-loader/dynamic-loader';
import { ScheduleTemplateBase, ScheduleActionEmail } from 'models/schedulers/schedulers.base';
import { IFlow2InvitationDate } from 'core/events.gen';

function generateDateString(dates: IFlow2InvitationDate): string {
    return dates.map( (date) => {
        return `${date.start.toLocaleString()} to ${date.end.toLocaleString()}`;
    }).join("<BR />");
}

export interface IFlow2InputScheduleTemplateEmail_CompleteInvitation {
    visitor: {
        name: string;
        dates: IFlow2InvitationDate;
    }
}

export class Flow2ScheduleTemplateEmail_CompleteInvitation extends ScheduleTemplateBase<
    ScheduleActionEmail,
    IFlow2InputScheduleTemplateEmail_CompleteInvitation
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
    </div>
            `;

            return { subject, body };
        });
    }

}
