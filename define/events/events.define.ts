import { Config as IConfig } from './../../../models/events/events.define';
import { Config } from 'core/config.gen';

let events: IConfig[] = [];

/// 0000 for <Shared>
/// 1000 for Administrator
/// 2000 for Tenant
/// 3000 for Visitor
/// 4000 for Kiosk

let flow = Config.vms.flow;

{
    let eventtmp: IConfig[] = [
        /// 100~ for system ////////////////////////
        ["101", `ConfigChanged`, `
            key: string;
            value: any;
        `],

        ["202", `UserAdd`],
        ["203", `UserEdit`],
        ["204", `UserRemove`, `
            /**
             * User being removed.
             */
            name: string;
        `],

        ["212", `KioskAdd`],
        ["213", `KioskEdit`],
        ["214", `KioskRemove`, `
            /**
             * Kiosk being removed.
             */
            name: string;
        `],

        ["300", `LicenseAdd`, `
            key: string;
        `],
        ////////////////////////////////////////////
    ];
    events.splice(events.length, 0, ...eventtmp);
}

if (flow === "Flow1") {
    let eventtmp: IConfig[] = [
        /// 3000 for Visitor ///////////////////////
    
        ["3100", `${flow}InvitationComplete`, `
            invitation: ${flow}Invitations;
            company: ${flow}Companies;
            visitors: ${flow}Visitors[];
        `, [`${flow}Companies`, `${flow}Invitations`, `${flow}Visitors`]],
    
        /// Strict Rule Register
        ["3101", `${flow}PreRegistrationComplete`, `
            /**
             * Invitation visitor that completes register.
             */
            invitation: ${flow}Invitations;
            /**
             * Company that invites this visitor.
             */
            company: ${flow}Companies;
            visitor: ${flow}Visitors;
        `, [`${flow}Companies`, `${flow}Invitations`, `${flow}Visitors`]],
    
        ["3110", `${flow}StrictTryCheckIn`, `
            pin: string;        
            /**
             * Invitation visitor that completes register.
             */
            invitation: ${flow}Invitations;
            /**
             * Company that invites this visitor.
             */
            company: ${flow}Companies;
            kiosk: Parse.User;
        `, [`I${flow}InvitationVisitors`]],
    
        ["3111", `${flow}StrictConfirmPhoneNumber`, `
            pin: string;
            phone: string;
            /**
             * correct or wrong phone number?
             */
            result: boolean;
            /**
             * Invitation visitor that completes register.
             */
            invitation: ${flow}Invitations;
            /**
             * Company that invites this visitor.
             */
            company: ${flow}Companies;
            kiosk: Parse.User;
        `],
    
        ["3112", `${flow}StrictScanIDCard`, `
            pin: string;
            name: string;
            birthdate: string;
            idnumber: string;
            images: Parse.File[];
            invitation: ${flow}Invitations;
            company: ${flow}Companies;
            kiosk: Parse.User;
        `],
    
        ["3113", `${flow}StrictCompareFace`, `
            pin: string;
            image: Parse.File;
            invitation: ${flow}Invitations;
            company: ${flow}Companies;
            kiosk: Parse.User;
            score: number;
            /**
             * Compare face result.
             */
            result: boolean;
        `],
    
        ["3114", `${flow}StrictCompleteCheckIn`, `
            pin: string;
            invitation: ${flow}Invitations;
            company: ${flow}Companies;
            visitor: ${flow}Visitors;
            visitorName: string;
            kiosk: Parse.User;
        `, [`${flow}Visitors`]],
    
        /// Register
        ["3115", `${flow}RegistrationComplete`],
    
        /// Check In
        ["3116", `${flow}TryCheckIn`],
        ["3117", `${flow}FaceVerifyResult`, `
            /**
             * Verified face image and final result.
             */
            image: Parse.File;
            result: boolean;
        `],
        ["3118", `${flow}DoneCheckIn`, `
            /**
             * Check-in final result.
             */
            result: boolean;
        `],
        ////////////////////////////////////////////
    ];
    events.splice(events.length, 0, ...eventtmp);
}

if (flow === "Flow2") {
    let eventtmp: IConfig[] = [
        /// 3000 for Visitor ///////////////////////
    
        ["3100", `${flow}InvitationComplete`, `
            invitation: ${flow}Invitations;
            company: ${flow}Companies;
            visitors: ${flow}Visitors[];
        `, [`${flow}Companies`, `${flow}Invitations`, `${flow}Visitors`]],
    
        /// Strict Rule Register
        ["3101", `${flow}PreRegistrationComplete`, `
            /**
             * Invitation visitor that completes register.
             */
            invitation: ${flow}Invitations;
            /**
             * Company that invites this visitor.
             */
            company: ${flow}Companies;
            visitor: ${flow}Visitors;
        `, [`${flow}Companies`, `${flow}Invitations`, `${flow}Visitors`]],
    
        ["3110", `${flow}StrictTryCheckIn`, `
            pin: string;        
            /**
             * Invitation visitor that completes register.
             */
            invitation: ${flow}Invitations;
            /**
             * Company that invites this visitor.
             */
            company: ${flow}Companies;
            kiosk: Parse.User;
        `, [`I${flow}InvitationVisitors`]],
    
        ["3111", `${flow}StrictConfirmPhoneNumber`, `
            pin: string;
            phone: string;
            /**
             * correct or wrong phone number?
             */
            result: boolean;
            /**
             * Invitation visitor that completes register.
             */
            invitation: ${flow}Invitations;
            /**
             * Company that invites this visitor.
             */
            company: ${flow}Companies;
            kiosk: Parse.User;
        `],
    
        ["3112", `${flow}StrictScanIDCard`, `
            pin: string;
            name: string;
            birthdate: string;
            idnumber: string;
            images: Parse.File[];
            invitation: ${flow}Invitations;
            company: ${flow}Companies;
            kiosk: Parse.User;
        `],
    
        ["3113", `${flow}StrictCompareFace`, `
            pin: string;
            image: Parse.File;
            invitation: ${flow}Invitations;
            company: ${flow}Companies;
            kiosk: Parse.User;
            score: number;
            /**
             * Compare face result.
             */
            result: boolean;
        `],
    
        ["3114", `${flow}StrictCompleteCheckIn`, `
            invitation: ${flow}Invitations;
            company: ${flow}Companies;
            visitor: ${flow}Visitors;
            visitorName: string;
            kiosk: Parse.User;
        `, [`${flow}Visitors`]],
    
        /// Register
        ["3115", `${flow}RegistrationComplete`],
    
        /// Check In
        ["3116", `${flow}TryCheckIn`],
        ["3117", `${flow}FaceVerifyResult`, `
            /**
             * Verified face image and final result.
             */
            image: Parse.File;
            result: boolean;
        `],
        ["3118", `${flow}DoneCheckIn`, `
            /**
             * Check-in final result.
             */
            result: boolean;
        `],

        /// flow 2 special
        ["4022", `${flow}CompanyAdd`, `
            company: ${flow}Companies;
        `],
        ["4023", `${flow}CompanyEdit`, `
            company: ${flow}Companies;
        `],
        ["4024", `${flow}CompanyRemove`, `
            /**
             * Company being removed.
             */
            name: string;
        `],

        ["4030", `${flow}Concierge`],
        ////////////////////////////////////////////
    ];
    events.splice(events.length, 0, ...eventtmp);
}

export default events;
