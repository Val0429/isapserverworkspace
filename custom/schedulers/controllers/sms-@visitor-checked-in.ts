import { DynamicLoader } from 'helpers/dynamic-loader/dynamic-loader';
import { EventLogin } from 'core/events.gen';
import { Config } from 'core/config.gen';

import { EventStrictCompleteCheckIn } from 'core/events.gen';

import { ScheduleTemplateSMS_VisitorCheckedIn } from './../templates/sms-@visitor-checked-in';
import { ScheduleControllerBase, ScheduleActionSMS } from 'models/schedulers/schedulers.base';
import { Invitations, IInvitations } from './../../../custom/models/invitations';

import { getEnumKey } from 'helpers/utility/get-enum-key';

import { ICompanies } from './../../models/companies';
import { IVisitors } from './../../models/visitors';
import { Purposes, IPurposes } from './../../models/purposes';

import { IUserTenantAdministrator, IUserKiosk } from 'core/userRoles.gen';


@DynamicLoader.set("ScheduleController.SMS.VisitorCheckedIn")
export class ScheduleControllerSMS_VisitorCheckedIn extends ScheduleControllerBase<
    EventStrictCompleteCheckIn,
    ScheduleActionSMS,
    ScheduleTemplateSMS_VisitorCheckedIn
    > {
    
    constructor() {
        super(ScheduleActionSMS, ScheduleTemplateSMS_VisitorCheckedIn);

        this.registerTemplate( async (event, data) => {
            let invitation: IInvitations = (await event.getValue("invitation").fetch()).attributes;
            let visitor: IVisitors = (await invitation.visitor.fetch()).attributes;
            let admin: IUserTenantAdministrator = (await invitation.parent.fetch()).attributes;
            let kiosk: IUserKiosk = (await event.getValue("owner").fetch()).attributes;
            let purpose: IPurposes = (await invitation.purpose.fetch()).attributes;
            
            return {
                visitor: {
                    name: visitor.name,
                    purpose: purpose.name
                },
                host: {
                    name: admin.username
                },
                kiosk: {
                    name: kiosk.data.kioskName
                }
            }
        });

        this.registerAction( async (event, data) => {
            let invitation: IInvitations = (await event.getValue("invitation").fetch()).attributes;
            let admin: IUserTenantAdministrator = (await invitation.parent.fetch()).attributes;
            return {
                phone: admin.phone,
                comPort: Config.sms.comPort,
                timeout: Config.sms.timeout
            }
        });
    }
}
