import { DynamicLoader } from 'helpers/dynamic-loader/dynamic-loader';
import { ScheduleTemplateBase, ScheduleActionEmail } from 'models/schedulers/schedulers.base';
import { Pin } from 'services/pin-code/pin-code';

export interface PinCodeInstance {
    pins: Pin[];
    dates: Date[];
}

/// email example
export interface IInputScheduleTemplateEmail_PreRegistration {
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

export class ScheduleTemplateEmail_PreRegistration extends ScheduleTemplateBase<
    ScheduleActionEmail,
    IInputScheduleTemplateEmail_PreRegistration
    > {

    constructor() {
        super();

        this.register( (input) => {
            let subject = `Visitor Invitation from ${input.company.name}`;

            let body = `
    <div style="color: #333; font-family: Calibri Light; font-size: 18;">
        <p>Hi ${input.visitor.name},</p>
        <p>${input.company.name} has sent you an invitation for your ${input.visitor.purposeOfVisit}.
        Kindly complete the registration by following the instructions on this link:</p>
        <p><a href="${input.linkPreRegistrationPage}">Click here to complete your registration</a> --> Unique Link to Pre-Registration Page
        Take note of your PinCode / QRCode to verify your registration to our Kiosk.</p>

        ${
            input.pinCodes.dates.map( (date, index) => {
                let pin = input.pinCodes.pins[index];
                return `
                    <p>Your visit date is: <b style="font-size: 24">${date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</b></p>
                    <p>Your Pincode is: <b style="font-size: 24">${pin}</b></p>
                `;
            }).join("")
        }

        <p>For further inquiries contact: <b>${input.company.name}</b> at <a href="mailto://${input.company.email}">${input.company.email}</a> / ${input.company.phone}</p>
    </div>
            `;

            return { subject, body };
        });
    }

}
