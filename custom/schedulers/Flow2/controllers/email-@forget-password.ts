import { DynamicLoader } from 'helpers/dynamic-loader/dynamic-loader';
import { ScheduleControllerBase, ScheduleActionEmail } from 'models/schedulers/schedulers.base';
import { Flow2ScheduleTemplateEmail_ForgetPassword } from '../templates';
import { EventFlow2InvitationComplete, EventFlow2StrictCompleteCheckIn, Flow2Visitors } from 'core/events.gen';

export interface IFlow2InputScheduleControllerEmail_ForgetPassword {
    user: {
        name: string;
        email: string;
        newpassword: string;
    }
}

@DynamicLoader.set("Flow2.ScheduleController.Email.ForgetPassword")
export class Flow2ScheduleControllerEmail_ForgetPassword extends ScheduleControllerBase<
    IFlow2InputScheduleControllerEmail_ForgetPassword,
    ScheduleActionEmail,
    Flow2ScheduleTemplateEmail_ForgetPassword
    > {
    
    constructor() {
        super(ScheduleActionEmail, Flow2ScheduleTemplateEmail_ForgetPassword);

        this.registerTemplate( async (event, data) => {
            return event;
        });
        this.registerAction( async (event, data) => {
            let { name, email, newpassword } = event.user;
            return {
                to: [email]
            }
        });
    }
}
