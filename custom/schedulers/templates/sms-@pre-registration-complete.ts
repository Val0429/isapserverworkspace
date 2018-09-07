import { DynamicLoader } from 'helpers/dynamic-loader/dynamic-loader';
import { ScheduleTemplateBase, IOutputScheduleTemplateSMS } from 'models/schedulers/schedulers.base';
import { Pin } from 'services/pin-code/pin-code';


export interface IInputScheduleTemplateSMS_PreRegistrationComplete {
    visitor: {
        name: string;
    },
    host: {
        name: string;
    }
}

export class ScheduleTemplateSMS_PreRegistrationComplete extends ScheduleTemplateBase<
    IInputScheduleTemplateSMS_PreRegistrationComplete,
    IOutputScheduleTemplateSMS
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

