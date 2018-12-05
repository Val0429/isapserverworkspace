import { DynamicLoader } from 'helpers/dynamic-loader/dynamic-loader';
import { EventLogin } from 'core/events.gen';

import { EventPreRegistrationComplete } from 'core/events.gen';

import { ScheduleTemplateEmail_PreRegistrationComplete } from './../templates/email-@pre-registration-complete';
import { ScheduleControllerBase, ScheduleActionEmail } from 'models/schedulers/schedulers.base';
import { Invitations, IInvitations } from './../../../custom/models/invitations';

import { getEnumKey } from 'helpers/utility/get-enum-key';

import { ICompanies } from './../../models/companies';
import { IVisitors } from './../../models/visitors';
import { Purposes } from './../../models/purposes';

import { IUserTenantAdministrator } from 'core/userRoles.gen';


@DynamicLoader.set("ScheduleController.Email.PreRegistrationComplete")
export class ScheduleControllerEmail_PreRegistrationComplete extends ScheduleControllerBase<
    EventPreRegistrationComplete,
    ScheduleActionEmail,
    ScheduleTemplateEmail_PreRegistrationComplete
    > {
    
    constructor() {
        super(ScheduleActionEmail, ScheduleTemplateEmail_PreRegistrationComplete);

        this.registerTemplate( async (event, data) => {
            let invitation: IInvitations = (await event.getValue("invitation").fetch()).attributes;
            let visitor: IVisitors = (await invitation.visitor.fetch()).attributes;
            let admin: IUserTenantAdministrator = (await invitation.parent.fetch()).attributes;
            
            return {
                visitor: {
                    name: visitor.name
                },
                host: {
                    name: admin.username
                }
            }
        });

        this.registerAction( async (event, data) => {
            let invitation: IInvitations = (await event.getValue("invitation").fetch()).attributes;
            let admin: IUserTenantAdministrator = (await invitation.parent.fetch()).attributes;
            return {
                to: [admin.publicEmailAddress]
            }
        });
    }
}
