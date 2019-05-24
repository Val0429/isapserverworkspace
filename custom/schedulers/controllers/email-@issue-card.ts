import { DynamicLoader } from 'helpers/dynamic-loader/dynamic-loader';
import { EventLogin, EventStrictCompleteCheckIn, EnrolledCards } from 'core/events.gen';

import { EventPreRegistrationComplete } from 'core/events.gen';

import { ScheduleTemplateEmail_IssueCard } from '../templates/email-@issue-card';
import { ScheduleControllerBase, ScheduleActionEmail } from 'models/schedulers/schedulers.base';
import { Invitations, IInvitations } from '../../models/invitations';

import { getEnumKey } from 'helpers/utility/get-enum-key';

import { ICompanies } from '../../models/companies';
import { IVisitors } from '../../models/visitors';
import { Purposes } from '../../models/purposes';

import QRCode from 'services/qr-code';
import VisitorCode from 'workspace/custom/services/visitor-code';

import { IUserTenantAdministrator } from 'core/userRoles.gen';


@DynamicLoader.set("ScheduleController.Email.IssueCard")
export class ScheduleControllerEmail_IssueCard extends ScheduleControllerBase<
    EnrolledCards,
    ScheduleActionEmail,
    ScheduleTemplateEmail_IssueCard
    > {
    
    constructor() {
        super(ScheduleActionEmail, ScheduleTemplateEmail_IssueCard);

        this.registerTemplate( async (event, data) => {
            let { name, visitDate: date } = event.attributes;
            return {
                visitor: {
                    name, date,
                }
            }
        });

        this.registerAction( async (event, data) => {
            let { email, qrcode } = event.attributes;
            return {
                to: [email],
                attachments: [{ file: qrcode, cid: 'qrcode' }]
            }
        });
    }
}
