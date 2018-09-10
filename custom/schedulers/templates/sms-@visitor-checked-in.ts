import { DynamicLoader } from 'helpers/dynamic-loader/dynamic-loader';
import { ScheduleTemplateBase, IOutputScheduleTemplateSMS } from 'models/schedulers/schedulers.base';
import { Pin } from 'services/pin-code/pin-code';


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
    IInputScheduleTemplateSMS_VisitorCheckedIn,
    IOutputScheduleTemplateSMS
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

