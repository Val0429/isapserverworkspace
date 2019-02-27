import { DynamicLoader } from 'helpers/dynamic-loader/dynamic-loader';
import { ScheduleTemplateBase, ScheduleActionSMS } from 'models/schedulers/schedulers.base';
import { Pin } from 'services/pin-code';


export interface IInputScheduleTemplateSMS_PreRegistrationComplete {
    visitor: {
        name: string;
    },
    host: {
        name: string;
    }
}

export class ScheduleTemplateSMS_PreRegistrationComplete extends ScheduleTemplateBase<
    ScheduleActionSMS,
    IInputScheduleTemplateSMS_PreRegistrationComplete
    > {

    constructor() {
        super();

        this.register( (input) => {
            let message = `
Hi ${input.host.name}, your visitor ${input.visitor.name} has already completed registration.
            `;

            return { message }
        });
    }

}

