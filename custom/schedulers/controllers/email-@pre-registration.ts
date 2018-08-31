import { DynamicLoader } from 'helpers/dynamic-loader/dynamic-loader';
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
            let visitor: IVisitors = invitation.visitor.attributes;
            let company: ICompanies = visitor.company.attributes;
            let purpose = invitation.purpose;
            let pins = invitation.pins;
            let dates = invitation.dates;
            
            return {
                company: {
                    name: company.name
                },
                pinCodes: {
                    pins,
                    dates
                },
                linkPreRegistrationPage: "http",
                visitor: {
                    name: visitor.name,
                    email: visitor.email,
                    phone: visitor.phone,
                    purposeOfVisit: getEnumKey(Purposes, purpose)
                }
            }
        });

        this.registerAction( (event, data) => {
            let invitation: IInvitations = event.attributes;
            let tenantAdmin: IUserTenantAdministrator = invitation.parent.attributes;
            return {
                to: [tenantAdmin.publicEmailAddress]
            }
        });
    }
}
