import { DynamicLoader } from 'helpers/dynamic-loader/dynamic-loader';
import { ScheduleControllerBase, ScheduleActionEmail } from 'models/schedulers/schedulers.base';
import { Flow1ScheduleTemplateEmail_CompleteInvitation } from '../templates';
import { EventFlow1InvitationComplete, Flow1Visitors } from 'core/events.gen';

@DynamicLoader.set("Flow1.ScheduleController.Email.CompleteInvitation")
export class Flow1ScheduleControllerEmail_CompleteInvitation extends ScheduleControllerBase<
    EventFlow1InvitationComplete,
    ScheduleActionEmail,
    Flow1ScheduleTemplateEmail_CompleteInvitation
    > {
    
    constructor() {
        super(ScheduleActionEmail, Flow1ScheduleTemplateEmail_CompleteInvitation);

        this.registerTemplate( async (event, data) => {
            let { visitor, qrcode, pin }: { visitor: Flow1Visitors, qrcode: Parse.File, pin: string } = data;
            let name = visitor.get("name");
            let dates = event.attributes.invitation.attributes.dates;
            return {
                visitor: {
                    name, dates, pin
                }
            }
        });

        this.registerAction( async (event, data) => {
            let { visitor, qrcode }: { visitor: Flow1Visitors, qrcode: Parse.File } = data;
            let email = visitor.getValue("email");
            return {
                to: [email],
                attachments: [{ file: qrcode, cid: 'qrcode' }]
            }
        });
    }
}
