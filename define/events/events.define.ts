import { Config as IConfig } from './../../../models/events/events.define';

let events: IConfig[] = [];

/// 0000 for <Shared>
/// 1000 for Administrator
/// 2000 for Tenant
/// 3000 for Visitor
/// 4000 for Kiosk

let flow;

{
    let eventtmp: IConfig[] = [
        /// 100~ for system ////////////////////////
        ["101", `ConfigChanged`, `
            key: string;
            value: any;
        `],
        ////////////////////////////////////////////
    ];
    events.splice(events.length, 0, ...eventtmp);
}

flow = "Flow1";
{
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
            visitor: ${flow}Visitors;
            kiosk: Parse.User;
        `],
    
        ["3113", `${flow}StrictCompareFace`, `
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
    
        ["3114", `${flow}StrictCompleteCheckIn`, `
            pin: string;
            invitation: ${flow}Invitations;
            company: ${flow}Companies;
            visitor: ${flow}Visitors;
            kiosk: Parse.User;
        `],
    
        /// Register
        // ["3115", `${flow}TryRegister`],
        // ["3116", `${flow}PickFloor`, `
        //     /**
        //      * Floors object pick by Person.
        //      */
        //     floor: ${flow}Floors;
        // `, [`${flow}Floors`]],
        // ["3", `${flow}ScanIDCard`, `
        //     /**
        //      * Extracted info from ID Card.
        //      */
        //     name: string;
        //     birthdate: string;
        //     idnumber: string;
        //     image: Parse.File[];
        // `],
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

export default events;
