import { DynamicLoader } from 'helpers/dynamic-loader/dynamic-loader';
import { ScheduleTemplateBase, ScheduleActionEmail } from 'models/schedulers/schedulers.base';


export interface IInputScheduleTemplateEmail_IssueCard {
    visitor: {
        name: string;
        date: Date;
    }
}

export class ScheduleTemplateEmail_IssueCard extends ScheduleTemplateBase<
    ScheduleActionEmail,
    IInputScheduleTemplateEmail_IssueCard
    > {

    constructor() {
        super();

        this.register( (input) => {
            let subject = `Visitor ${input.visitor.name} QRCode`;

            let body = `
    <div style="color: #333; font-family: Calibri Light; font-size: 18;">
        <p>Hi ${input.visitor.name},</p>
        <p>Your QRCode for visiting date: ${input.visitor.date.toLocaleDateString()}</p>
        <img src="cid:qrcode" />
    </div>
            `;

            return { subject, body };
        });
    }

}
