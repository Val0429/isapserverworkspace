import { DynamicLoader } from 'helpers/dynamic-loader/dynamic-loader';
import { ScheduleTemplateBase, ScheduleActionEmail } from 'models/schedulers/schedulers.base';


export interface IInputScheduleTemplateEmail_VisitorCheckedIn {
    visitor: {
        name: string;
        purpose: string;
    },
    host: {
        name: string;
    },
    kiosk: {
        name: string;
    }
}

export class ScheduleTemplateEmail_VisitorCheckedIn extends ScheduleTemplateBase<
    ScheduleActionEmail,
    IInputScheduleTemplateEmail_VisitorCheckedIn
    > {

    constructor() {
        super();

        this.register( (input) => {
            let subject = `Visitor ${input.visitor.name} check-in for ${input.visitor.purpose} at ${input.kiosk.name}`;

            let body = `
    <div style="color: #333; font-family: Calibri Light; font-size: 18;">
        <p>Hi ${input.host.name},</p>
        <p>Your visitor ${input.visitor.name} has arrived and checked-in at ${input.kiosk.name}.</p>
    </div>
            `;

            return { subject, body };
        });
    }

}
