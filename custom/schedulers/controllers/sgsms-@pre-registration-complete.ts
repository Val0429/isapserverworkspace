import { DynamicLoader } from 'helpers/dynamic-loader/dynamic-loader';
import { EventLogin } from 'core/events.gen';
import { Config } from 'core/config.gen';

import { EventPreRegistrationComplete } from 'core/events.gen';

import { ScheduleTemplateSMS_PreRegistrationComplete } from './../templates/sms-@pre-registration-complete';
import { ScheduleControllerBase, ScheduleActionSGSMS } from 'models/schedulers/schedulers.base';
import { Invitations, IInvitations } from './../../../custom/models/invitations';

import { getEnumKey } from 'helpers/utility/get-enum-key';

import { ICompanies } from './../../models/companies';
import { IVisitors } from './../../models/visitors';
import { Purposes } from './../../models/purposes';

import { IUserTenantAdministrator } from 'core/userRoles.gen';


@DynamicLoader.set("ScheduleController.SGSMS.PreRegistrationComplete")
export class ScheduleControllerSGSMS_PreRegistrationComplete extends ScheduleControllerBase<
    EventPreRegistrationComplete,
    ScheduleActionSGSMS,
    ScheduleTemplateSMS_PreRegistrationComplete
    > {
    
    constructor() {
        super(ScheduleActionSGSMS, ScheduleTemplateSMS_PreRegistrationComplete);

        this.registerTemplate( async (event, data) => {
            console.log('sgsms register')
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
            console.log('sgsms register action')
            let invitation: IInvitations = (await event.getValue("invitation").fetch()).attributes;
            let admin: IUserTenantAdministrator = (await invitation.parent.fetch()).attributes;
            let company: ICompanies = (await admin.data.company.fetch()).attributes;
            return {
                from: company.name,
                username: Config.sgsms.username,
                password: Config.sgsms.password,
                phone: admin.phone
            }
        });
    }
}
