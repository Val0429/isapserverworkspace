import { DynamicLoader } from 'helpers/dynamic-loader/dynamic-loader';
import { ScheduleTemplateBase, IOutputScheduleTemplateEmail } from 'models/schedulers/schedulers.base';


export interface IInputScheduleTemplateEmail_PreRegistrationComplete {
    visitor: {
        name: string;
    },
    host: {
        name: string;
    }
}

export class ScheduleTemplateEmail_PreRegistrationComplete extends ScheduleTemplateBase<
    IInputScheduleTemplateEmail_PreRegistrationComplete,
    IOutputScheduleTemplateEmail
    > {

    constructor() {
        super();

        this.register( (input) => {
            let subject = `Visitor ${input.visitor.name} Pre-Registration Complete`;

            let body = `
    <div style="color: #333; font-family: Calibri Light; font-size: 18;">
        <p>Hi ${input.host.name},</p>
        <p>Your visitor ${input.visitor.name} has already completed registration.</p>
    </div>
            `;

            return { subject, body };
        });
    }

}
