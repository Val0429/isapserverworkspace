import { DynamicLoader } from 'helpers/dynamic-loader/dynamic-loader';
import { ScheduleTemplateBase, ScheduleActionSMS } from 'models/schedulers/schedulers.base';
import { Pin } from 'services/pin-code/pin-code';
import { PinCodeInstance } from './email-@pre-registration';

export interface IInputScheduleTemplateSMS_PreRegistration {
    company: {
        /// Company name
        name: string;
        email: string;
        phone: string;
    },
    visitor: {
        /// Visitor name, email, phone
        name: string;
        email: string;
        phone: string;
        purposeOfVisit: string;
    },
    linkPreRegistrationPage: string;
    pinCodes: PinCodeInstance;
}

export class ScheduleTemplateSMS_PreRegistration extends ScheduleTemplateBase<
    ScheduleActionSMS,
    IInputScheduleTemplateSMS_PreRegistration
    > {

    constructor() {
        super();

        this.register( (input) => {
            let message = `
            ${input.visitor.name}, ${input.company.name} has sent you invitation for your ${input.visitor.purposeOfVisit}.
            ${
                input.pinCodes.dates.map( (date, index) => {
                    let pin = input.pinCodes.pins[index];
                    return `
Date: ${date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}, 
Pincode: ${pin}. 
                    `;
                }).join("")
            }
Click here to complete your registration: ${input.linkPreRegistrationPage}
            `;

            return { message }
        });
    }

}

