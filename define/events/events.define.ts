import { Config } from './../../../models/events/events.define';

/// 0000 for <Shared>
/// 1000 for Administrator
/// 2000 for Tenant
/// 3000 for Visitor
/// 4000 for Kiosk
var events: Config[] = [
    /// 100~ for system ////////////////////////
    ["101", "ConfigChanged", `
        key: string;
        value: any;
    `],
    ////////////////////////////////////////////

    /// 3000 for Visitor ///////////////////////

    ["3400", "InvitationComplete", `
        invitation: Invitations;
        company: Companies;
        visitor: Visitors;
    `, ["Companies", "Invitations", "Visitors"]],

    /// 3500 - Strict Rule Register
    ["3501", "PreRegistrationComplete", `
        /**
         * Invitation visitor that completes register.
         */
        invitation: Invitations;
        /**
         * Company that invites this visitor.
         */
        company: Companies;
        visitor: Visitors;
    `, ["Companies", "Invitations", "Visitors"]],

    ["3510", "StrictTryCheckIn", `
        pin: string;        
        /**
         * Invitation visitor that completes register.
         */
        invitation: Invitations;
        /**
         * Company that invites this visitor.
         */
        company: Companies;
        visitor: Visitors;
        kiosk: Parse.User;
    `],

    ["3511", "StrictConfirmPhoneNumber", `
        pin: string;
        phone: string;
        /**
         * correct or wrong phone number?
         */
        result: boolean;
        /**
         * Invitation visitor that completes register.
         */
        invitation: Invitations;
        /**
         * Company that invites this visitor.
         */
        company: Companies;
        visitor: Visitors;
        kiosk: Parse.User;
    `],

    ["3512", "StrictScanIDCard", `
        pin: string;
        name: string;
        birthdate: string;
        idnumber: string;
        images: Parse.File[];
        invitation: Invitations;
        company: Companies;
        visitor: Visitors;
        kiosk: Parse.User;
    `],

    ["3513", "StrictCompareFace", `
        pin: string;
        image: Parse.File;
        invitation: Invitations;
        company: Companies;
        visitor: Visitors;
        kiosk: Parse.User;
        score: number;
        /**
         * Compare face result.
         */
        result: boolean;
    `],

    ["3514", "StrictCompleteCheckIn", `
        pin: string;
        invitation: Invitations;
        company: Companies;
        visitor: Visitors;
        kiosk: Parse.User;
    `],

    /// 3600 - Register
    ["3601", "TryRegister"],
    ["3602", "PickFloor", `
        /**
         * Floors object pick by Person.
         */
        floor: Floors;
    `, ["Floors"]],
    ["3603", "ScanIDCard", `
        /**
         * Extracted info from ID Card.
         */
        name: string;
        birthdate: string;
        idnumber: string;
        image: Parse.File[];
    `],
    ["3688", "RegistrationComplete"],

    /// 3700 - Check In
    ["3701", "TryCheckIn"],
    ["3702", "FaceVerifyResult", `
        /**
         * Verified face image and final result.
         */
        image: Parse.File;
        result: boolean;
    `],
    ["3788", "DoneCheckIn", `
        /**
         * Check-in final result.
         */
        result: boolean;
    `],
    ////////////////////////////////////////////
];

export default events;
