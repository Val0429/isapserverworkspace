import { DynamicLoader } from 'helpers/dynamic-loader/dynamic-loader';
import { EventLogin } from 'core/events.gen';
import { Config } from 'core/config.gen';

import { ScheduleTemplateSMS_PreRegistration } from './../templates/sms-@pre-registration';
import { ScheduleControllerBase, ScheduleActionSGSMS } from 'models/schedulers/schedulers.base';
import { Invitations, IInvitations } from './../../../custom/models/invitations';

import { getEnumKey } from 'helpers/utility/get-enum-key';

import { ICompanies } from './../../models/companies';
import { IVisitors } from './../../models/visitors';
import { Purposes } from './../../models/purposes';

import { IUserTenantAdministrator } from 'core/userRoles.gen';


@DynamicLoader.set("ScheduleController.SGSMS.PreRegistration")
export class ScheduleControllerSGSMS_PreRegistration extends ScheduleControllerBase<
    Invitations,
    ScheduleActionSGSMS,
    ScheduleTemplateSMS_PreRegistration
    > {
    
    constructor() {
        super(ScheduleActionSGSMS, ScheduleTemplateSMS_PreRegistration);

        this.registerTemplate( async (event, data) => {
            let invitation: IInvitations = event.attributes;
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
                linkPreRegistrationPage: "http://www.google.com",
                visitor: {
                    name: visitor.name,
                    email: visitor.email,
                    phone: visitor.phone,
                    purposeOfVisit: getEnumKey(Purposes, purpose.getValue("name"))
                }
            }
        });

        this.registerAction( async (event, data) => {
            let invitation: IInvitations = event.attributes;
            let visitor: IVisitors = invitation.visitor.attributes;
            let company: ICompanies = (await visitor.company.fetch()).attributes;
            return {
                from: company.name,
                username: Config.sgsms.username,
                password: Config.sgsms.password,
                phone: visitor.phone
            }
        });
        
    }
}
