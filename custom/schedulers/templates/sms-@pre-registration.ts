import { DynamicLoader } from 'helpers/dynamic-loader/dynamic-loader';
import { ScheduleTemplateBase, IOutputScheduleTemplateSMS } from 'models/schedulers/schedulers.base';
import { Pin } from 'services/pin-code/pin-code';

export interface PinCodeInstance {
    pins: Pin[];
    dates: Date[];
}

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
    IInputScheduleTemplateSMS_PreRegistration,
    IOutputScheduleTemplateSMS
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

