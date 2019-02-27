import { DynamicLoader } from 'helpers/dynamic-loader/dynamic-loader';
import { ScheduleTemplateBase, ScheduleActionSMS } from 'models/schedulers/schedulers.base';
import { Pin } from 'services/pin-code';


export interface IInputScheduleTemplateSMS_VisitorCheckedIn {
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

export class ScheduleTemplateSMS_VisitorCheckedIn extends ScheduleTemplateBase<
    ScheduleActionSMS,
    IInputScheduleTemplateSMS_VisitorCheckedIn
    > {

    constructor() {
        super();

        this.register( (input) => {
            let message = `
Hi ${input.host.name}, your visitor ${input.visitor.name} has arrived and checked-in at ${input.kiosk.name}.
            `;

            return { message }
        });
    }

}

