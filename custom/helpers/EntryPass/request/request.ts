import * as xmlbuilder from 'xmlbuilder'
import { EntryPassCardInfo } from '../EntryPassWorker'
import { EntryPassStaffInfo } from '../EntryPassWorker'

const CRLF = '\r\n'

export interface EntryPassCardInfoEx extends EntryPassCardInfo {
    serviceID: string
    trackID: string
}

export interface EntryPassStaffInfoEx extends EntryPassStaffInfo {
    serviceID: string
    trackID: string
}

const getDateNow = (yearShift?: number) => {
    let date = new Date();
    let year = yearShift === undefined ? date.getFullYear() : (date.getFullYear() + yearShift).toString();
    let month = (date.getMonth() + 1) < 10 ? '0' + (date.getMonth() + 1).toString() : (date.getMonth() + 1).toString();
    let day = date.getDate() < 10 ? '0' + date.getDate().toString() : date.getDate().toString();
    return year + month + day;
}

export function GetTrackRequest(serviceID: string) {
    //let xml = '<SERVICE ID="' + serviceID + '"><TRACKID_GET></TRACKID_GET></SERVICE>';
    let xml = xmlbuilder.create({
        SERVICE: {
            '@ID': serviceID,
            TRACKID_GET: ""
        }
    }, { headless: true }).end({ pretty: false })
    return xml + CRLF;
}

export function GetAddCardRequest(staffInfo: EntryPassStaffInfoEx, cardInfo: EntryPassCardInfoEx) {
    let staffCommand = {
        COMMAND: {
            '@ID': 1,
            '@COMCODE': 'STAFF_ADD',
            STAFF_NAME: staffInfo.name,
            STAFF_NO: staffInfo.serialNumber,
            DEPARTMENT: staffInfo.department !== undefined ? staffInfo.department : "",
            JOB: staffInfo.job !== undefined ? staffInfo.job : "",
            DATE_OF_JOIN: staffInfo.dateOfJoin !== undefined ? staffInfo.dateOfJoin : getDateNow(),
            DATE_OF_BIRTH: staffInfo.dateOfBirth !== undefined ? staffInfo.dateOfBirth : "19700101",
            SHIFT: "",
            GENDER: 0,
            IC_NO: "",
            UDF_1: "",
            UDF_2: "",
            UDF_3: "",
            UDF_4: "",
            UDF_5: "",
            UDF_6: "",
            UDF_7: "",
            UDF_8: "",
            UDF_9: "",
            UDF_10: "",
            SHIFT_TYPE: 0,
            TA_LOGIN_NAME: "",
            TA_LOGIN_PASSWORD: "",
            IS_TA_ADMIN: 0,
            IS_SELF_AUTHORIZE: 0,
            PHOTO_FILE_NAME: "",
            IS_RESIGN: 0,
            DATE_OF_RESIGN: ""
        }
    }

    let cardCommand = {
        COMMAND: {
            '@ID': 2,
            '@COMCODE': 'CARD_ADD',
            STAFF_NO: staffInfo.serialNumber,
            CARD_NO: cardInfo.serialNumber,
            PIN_NO: 123456,
            ACCESS_LEVEL: 1,
            START_DATE: cardInfo.startDate !== undefined ? cardInfo.startDate : getDateNow(),
            END_DATE: cardInfo.endDate !== undefined ? cardInfo.endDate : getDateNow(100),
            CARD_TYPE: 0,
            IS_ACTIVATE: 1,
            IS_LIFT_CARD: cardInfo.liftInfo !== undefined ? cardInfo.liftInfo.isLiftCard : 0,
            IS_ANTI_PASSBACK: 1,
            BUDDY_NO: 0,
            LIFT_ACCESS_LEVEL: cardInfo.liftInfo !== undefined ? cardInfo.liftInfo.accessLevel : 1,
            LIFT_START_DATE: cardInfo.liftInfo !== undefined ? cardInfo.liftInfo.startDate : getDateNow(),
            LIFT_END_DATE: cardInfo.liftInfo !== undefined ? cardInfo.liftInfo.endDate : getDateNow(100),
            LIFT_IS_ACTIVATE: cardInfo.liftInfo !== undefined ? 1 : 0,
            ACCESS_GROUPS: {
                GROUP_NAME: cardInfo.accessGroup
            }
        }
    }

    let xml = xmlbuilder.create('SERVICE', { headless: true })
        .att('ID', cardInfo.serviceID)
        .ele('TRACKID')
        .att('ID', cardInfo.trackID)
        .ele(staffCommand)
        .up()
        .ele(cardCommand)
        .end({ pretty: false });

    return xml + CRLF;
}

export function GetRemoveCardRequest(staffInfo: EntryPassStaffInfoEx, cardInfo: EntryPassCardInfoEx, ) {
    let cardCommand = {
        COMMAND: {
            '@ID': 1,
            '@COMCODE': 'CARD_DEL',
            CARD_NO: cardInfo.serialNumber
        }
    }

    let staffCommand = {
        COMMAND: {
            '@ID': 2,
            '@COMCODE': 'STAFF_DEL',
            STAFF_NO: staffInfo.serialNumber
        }
    }

    let xml = xmlbuilder.create('SERVICE', { headless: true })
        .att('ID', cardInfo.serviceID)
        .ele('TRACKID')
        .att('ID', cardInfo.trackID)
        .ele(cardCommand)
        .up()
        .ele(staffCommand)
        .end({ pretty: false })
    return xml + CRLF
}

export function GetAddStaffRequest(staffInfo: EntryPassStaffInfoEx) {
    let command = {
        SERVICE: {
            '@ID': staffInfo.serviceID,
            TRACKID: {
                '@ID': staffInfo.trackID,
                COMMAND: {
                    '@ID': 1,
                    '@COMCODE': 'STAFF_ADD',
                    STAFF_NAME: staffInfo.name,
                    STAFF_NO: staffInfo.serialNumber,
                    DEPARTMENT: staffInfo.department !== undefined ? staffInfo.department : "",
                    JOB: staffInfo.job !== undefined ? staffInfo.job : "",
                    DATE_OF_JOIN: staffInfo.dateOfJoin !== undefined ? staffInfo.dateOfJoin : getDateNow(),
                    DATE_OF_BIRTH: staffInfo.dateOfBirth !== undefined ? staffInfo.dateOfBirth : "19700101",
                    SHIFT: "",
                    GENDER: 0,
                    IC_NO: "",
                    UDF_1: "",
                    UDF_2: "",
                    UDF_3: "",
                    UDF_4: "",
                    UDF_5: "",
                    UDF_6: "",
                    UDF_7: "",
                    UDF_8: "",
                    UDF_9: "",
                    UDF_10: "",
                    SHIFT_TYPE: 0,
                    TA_LOGIN_NAME: "",
                    TA_LOGIN_PASSWORD: "",
                    IS_TA_ADMIN: 0,
                    IS_SELF_AUTHORIZE: 0,
                    PHOTO_FILE_NAME: "",
                    IS_RESIGN: 0,
                    DATE_OF_RESIGN: ""
                }
            }
        }
    }
    let xml = xmlbuilder.create(command, { headless: true }).end({ pretty: false })
    return xml + CRLF
}

export function GetRemoveStaffRequest(staffInfo: EntryPassStaffInfoEx) {
    let command = {
        SERVICE: {
            '@ID': staffInfo.serviceID,
            TRACKID: {
                '@ID': staffInfo.trackID,
                COMMAND: {
                    '@ID': 1,
                    '@COMCODE': 'STAFF_DEL',
                    STAFF_NO: staffInfo.serialNumber
                }
            }
        }
    }

    let xml = xmlbuilder.create(command, { headless: true }).end({ pretty: false })
    return xml + CRLF
}