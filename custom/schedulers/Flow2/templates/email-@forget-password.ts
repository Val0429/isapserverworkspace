import { DynamicLoader } from 'helpers/dynamic-loader/dynamic-loader';
import { ScheduleTemplateBase, ScheduleActionEmail } from 'models/schedulers/schedulers.base';
import { IFlow2InvitationDate } from 'core/events.gen';
import { IFlow2InputScheduleControllerEmail_ForgetPassword } from '../controllers/email-@forget-password';

type IFlow2InputScheduleTemplateEmail_ForgetPassword = IFlow2InputScheduleControllerEmail_ForgetPassword;

export class Flow2ScheduleTemplateEmail_ForgetPassword extends ScheduleTemplateBase<
    ScheduleActionEmail,
    IFlow2InputScheduleTemplateEmail_ForgetPassword
    > {

    constructor() {
        super();

        this.register( (input) => {
            let subject = `User <${input.user.name}> Password renew`;

            let body = `
    <div style="color: #333; font-family: Calibri Light; font-size: 18;">
        <p>Hi ${input.user.name},</p>
        <p>Your password has been changed to ${input.user.newpassword}.</p>
    </div>
            `;

            return { subject, body };
        });
    }

}
