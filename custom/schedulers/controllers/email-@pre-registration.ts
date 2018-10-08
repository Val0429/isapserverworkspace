import { DynamicLoader } from 'helpers/dynamic-loader/dynamic-loader';
import { Config } from 'core/config.gen';
import { EventLogin } from 'core/events.gen';

import { ScheduleTemplateEmail_PreRegistration } from './../templates/email-@pre-registration';
import { ScheduleControllerBase, ScheduleActionEmail } from 'models/schedulers/schedulers.base';
import { Invitations, IInvitations } from './../../../custom/models/invitations';

import { getEnumKey } from 'helpers/utility/get-enum-key';

import { ICompanies } from './../../models/companies';
import { IVisitors } from './../../models/visitors';
import { Purposes } from './../../models/purposes';

import { IUserTenantAdministrator } from 'core/userRoles.gen';


@DynamicLoader.set("ScheduleController.Email.PreRegistration")
export class ScheduleControllerEmail_PreRegistration extends ScheduleControllerBase<
    Invitations,
    ScheduleActionEmail,
    ScheduleTemplateEmail_PreRegistration
    > {
    
    constructor() {
        super(ScheduleActionEmail, ScheduleTemplateEmail_PreRegistration);

        this.registerTemplate( async (event, data) => {
            let invitation: IInvitations = event.attributes;
            let visitorId: string = invitation.visitor.id;
            let visitor: IVisitors = invitation.visitor.attributes;
            let company: ICompanies = (await visitor.company.fetch()).attributes;
            let admin: IUserTenantAdministrator = (await invitation.parent.fetch()).attributes;
            let purpose = await invitation.purpose.fetch();
            let pins = invitation.dates.map( date => date.pin );
            let dates = invitation.dates.map( date => date.start );
            
            return {
                company: {
                    name: company.name,
                    email: admin.publicEmailAddress,
                    phone: admin.phone
                },
                pinCodes: {
                    pins,
                    dates
                },
                linkPreRegistrationPage: `http://localhost:${Config.core.port}/registration/potrait?objectId=${visitorId}`,
                visitor: {
                    name: visitor.name,
                    email: visitor.email,
                    phone: visitor.phone,
                    purposeOfVisit: getEnumKey(Purposes, purpose.getValue("name"))
                }
            }
        });

        this.registerAction( (event, data) => {
            let invitation: IInvitations = event.attributes;
            let visitor: IVisitors = invitation.visitor.attributes;
            return {
                to: [visitor.email]
            }
        });
    }
}
