import { DynamicLoader } from 'helpers/dynamic-loader/dynamic-loader';
import { ScheduleControllerBase, ScheduleActionEmail } from 'models/schedulers/schedulers.base';
import { Flow2ScheduleTemplateEmail_CompleteInvitation } from '../templates';
import { EventFlow2InvitationComplete, EventFlow2StrictCompleteCheckIn, Flow2Visitors } from 'core/events.gen';

@DynamicLoader.set("Flow2.ScheduleController.Email.CompleteInvitation")
export class Flow2ScheduleControllerEmail_CompleteInvitation extends ScheduleControllerBase<
    EventFlow2InvitationComplete | EventFlow2StrictCompleteCheckIn,
    ScheduleActionEmail,
    Flow2ScheduleTemplateEmail_CompleteInvitation
    > {
    
    constructor() {
        super(ScheduleActionEmail, Flow2ScheduleTemplateEmail_CompleteInvitation);

        this.registerTemplate( async (event, data) => {
            let { visitor, qrcode }: { visitor: Flow2Visitors, qrcode: Parse.File } = data;
            let name = visitor.get("name");
            let dates = event.attributes.invitation.attributes.dates;
            return {
                visitor: {
                    name, dates
                }
            }
        });

        this.registerAction( async (event, data) => {
            let { visitor, qrcode }: { visitor: Flow2Visitors, qrcode: Parse.File } = data;
            let email = visitor.getValue("email");
            return {
                to: [email],
                attachments: [{ file: qrcode, cid: 'qrcode' }]
            }
        });
    }
}
