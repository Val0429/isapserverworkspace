import { Config as IConfig } from './../../../models/events/events.define';
import { Config } from 'core/config.gen';

const flow = Config.vms.flow;

let events: IConfig[];

/// 0000 for <Shared>
/// 1000 for Administrator
/// 2000 for Tenant
/// 3000 for Visitor
/// 4000 for Kiosk
if (flow === "Flow1") {
    events = [
        /// 100~ for system ////////////////////////
        ["101", `${flow}ConfigChanged`, `
            key: string;
            value: any;
        `],
        ////////////////////////////////////////////
    
        /// 3000 for Visitor ///////////////////////
    
        ["3400", `${flow}InvitationComplete`, `
            invitation: ${flow}Invitations;
            company: ${flow}Companies;
            visitor: ${flow}Visitors;
        `, [`${flow}Companies`, `${flow}Invitations`, `${flow}Visitors`]],
    
        /// 3500 - Strict Rule Register
        ["3501", `${flow}PreRegistrationComplete`, `
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
    
        ["3510", `${flow}StrictTryCheckIn`, `
            pin: string;        
            /**
             * Invitation visitor that completes register.
             */
            invitation: ${flow}Invitations;
            /**
             * Company that invites this visitor.
             */
            company: ${flow}Companies;
            visitor: ${flow}Visitors;
            kiosk: Parse.User;
        `],
    
        ["3511", `${flow}StrictConfirmPhoneNumber`, `
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
            visitor: ${flow}Visitors;
            kiosk: Parse.User;
        `],
    
        ["3512", `${flow}StrictScanIDCard`, `
            pin: string;
            name: string;
            birthdate: string;
            idnumber: string;
            images: Parse.File[];
            invitation: ${flow}Invitations;
            company: ${flow}Companies;
            visitor: ${flow}Visitors;
            kiosk: Parse.User;
        `],
    
        ["3513", `${flow}StrictCompareFace`, `
            pin: string;
            image: Parse.File;
            invitation: ${flow}Invitations;
            company: ${flow}Companies;
            visitor: ${flow}Visitors;
            kiosk: Parse.User;
            score: number;
            /**
             * Compare face result.
             */
            result: boolean;
        `],
    
        ["3514", `${flow}StrictCompleteCheckIn`, `
            pin: string;
            invitation: ${flow}Invitations;
            company: ${flow}Companies;
            visitor: ${flow}Visitors;
            kiosk: Parse.User;
        `],
    
        /// 3600 - Register
        ["3601", `${flow}TryRegister`],
        ["3602", `${flow}PickFloor`, `
            /**
             * Floors object pick by Person.
             */
            floor: ${flow}Floors;
        `, [`${flow}Floors`]],
        ["3603", `${flow}ScanIDCard`, `
            /**
             * Extracted info from ID Card.
             */
            name: string;
            birthdate: string;
            idnumber: string;
            image: Parse.File[];
        `],
        ["3688", `${flow}RegistrationComplete`],
    
        /// 3700 - Check In
        ["3701", `${flow}TryCheckIn`],
        ["3702", `${flow}FaceVerifyResult`, `
            /**
             * Verified face image and final result.
             */
            image: Parse.File;
            result: boolean;
        `],
        ["3788", `${flow}DoneCheckIn`, `
            /**
             * Check-in final result.
             */
            result: boolean;
        `],
        ////////////////////////////////////////////
    ];
}

export default events;
