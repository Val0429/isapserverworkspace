import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import { User } from 'parse';
import { ICardholderObject } from '../modules/acs/sipass/siPass_define';

export interface ISystemLog{
    title:string;
    type?:string;
    message:string;
    user?:User;
    hidden?:boolean;
}
@registerSubclass()
export class SystemLog extends ParseObject<ISystemLog> { }

export interface ISipassToken{
    sessionId:string;
    expired:Date;
}
@registerSubclass()
export class SipassToken extends ParseObject<ISipassToken> { }

export interface IReader {      // R daily v
    system: number,             // 1: SiPass 2: CCure800
    readerid: number,
    readername: string,
    status: number
}
@registerSubclass()
export class Reader extends ParseObject<IReader> { }

export interface IDoor {    // CRUD daily V
    system?: number,         // 0: iSap 1: SiPass 2: CCure800
    doorid?: number,
    doorname: string,
    readerin?: Reader[],
    readerout?: Reader[],
    status?: number
}
@registerSubclass()
export class Door extends ParseObject<IDoor> { }

export interface IFloor {   // R daily V
    system?: number,         // 1: SiPass 2: CCure800
    floorid?: number,
    floorname: string,
    status?: number
}
@registerSubclass()
export class Floor extends ParseObject<IFloor> { }

export interface IFloorGroup {  // CRUD V
    system?: number,             // 0: iSap
    groupid?: number,
    groupname: string,
    floors?: Floor[],
    status?: number
}
@registerSubclass()
export class FloorGroup extends ParseObject<IFloorGroup> { }

export interface IElevator {    // CRUD V
    system: number,             // 0: iSap 1: SiPass 2: CCure800
    elevatorid?: number,
    elevatorname: string,
    reader?: Floor[],
    readergroup?: FloorGroup[],
    status?: number
}
@registerSubclass()
export class Elevator extends ParseObject<IElevator> { }

export interface IDoorGroup {   // CRUD V
    system?: number,             // 0: iSap
    groupid?: number,
    groupname?: string,
    doors?: Door[],
    status?: number
}
@registerSubclass()
export class DoorGroup extends ParseObject<IDoorGroup> { }

export interface IElevatorGroup {   // CRUD V
    system?: number,                 // 0: iSap 
    groupid?: number,
    groupname?: string,
    elevators?: Elevator[],
    status?: number
}
@registerSubclass()
export class ElevatorGroup extends ParseObject<IElevatorGroup> { }

export interface IMember{
    objectId? :string;
    void? :boolean;
    permissionTable?: number[];        
    personType?: number;
    employeeNumber :string;
    chineseName :string;
    englishName? :string;
    primaryWorkgroupName?:string;
    primaryWorkgroupId?:number;
    cardNumber? :string;
    cardAllNumber? :string;
    cardCertificate? :string;
    isImageChanged?:boolean;
    deviceNumber? :string | number;
    pinDigit? :string | number;
    profileName? :string;
    technologyCode? :string | number;
    pinMode? :string | number;
    pin? :string;
    startDate :string;
    endDate :string;
    cardholderPortrait? :string;
    account? :string;
    password? :string;
    email? :string;
    phone? :string;
    extensionNumber? :string;
    birthday? :string;
    allCardNumber?: string;
    companyName?: string;
    cardCustodian?: string;
    lastEditPerson?: string;
    lastEditTime?: string;
    cardType?: string;    
    MVPN?: string;
    gender?: string;
    department?: string;
    costCenter?: string;
    area?: string;
    workArea?: string;
    registrationDate?: string;
    resignationDate?: string;
    carLicenseCategory?: string;
    cardLicense?: string;
    carLicense?: string;
    carLicense1?: string;
    carLicense2?: string;
    carLicense3?: string;    
    resignationNote?: string;
    resignationRecordCardRecord?: string;
    reasonForCard1?: string;
    historyForCard1?: string;
    dateForCard1?: string;
    reasonForCard2?: string;
    historyForCard2?: string;
    dateForCard2?: string;
    reasonForCard3?: string;
    historyForCard3?: string;
    dateForCard3?: string;
    reasonForApplication1?: string;
    dateForApplication1?: string;
    reasonForApplication2?: string;
    dateForApplication2?: string;
    reasonForApplication3?: string;
    dateForApplication3?: string;
    resignationRecordCarLicense?: string;    
    censusRecord1?: string;
    censusDate1?: string;
    censusRecord2?: string;
    censusDate2?: string;
    censusRecord3?: string;
    censusDate3?: string;
    infoOfViolation1?: string;
    dateOfViolation1?: string;
    infoOfViolation2?: string;
    dateOfViolation2?: string;
    infoOfViolation3?: string;
    dateOfViolation3?: string;

    //for reporting
    month1?:number;
    month2?:number;
    month3?:number;
    lastDateOccured?:string;
    inOutDailyCount?:number;
    accessObjectId?:string;
    permissionName?:string
    timeSchedule?:string;
    doorGroupName?:string
    doorGroupObjectId?:string
    doorName?:string;
    doorObjectId?:string;
}
@registerSubclass()
export class Member extends ParseObject<ICardholderObject> { }
export interface ILinearMember{
        objectId? :string;
        void? :boolean;
        permissionTable?: PermissionTable[];        
        personType?: number;
        employeeNumber? :string;
        chineseName? :string;
        englishName? :string;
        primaryWorkgroupName?:string;
        primaryWorkgroupId?:number;
        cardNumber? :string;
        cardAllNumber? :string;
        cardCertificate? :string;
        isImageChanged?:boolean;
        deviceNumber? :number ;
        pinDigit? :number ;
        profileName? :string;
        technologyCode? :number ;
        pinMode? :number ;
        pin? :string;
        startDate? :string;
        endDate? :string;
        cardholderPortrait? :string;
        account? :string;
        password? :string;
        email? :string;
        phone? :string;
        extensionNumber? :string;
        birthday? :string;
        allCardNumber?: string;
        companyName?: string;
        cardCustodian?: string;
        lastEditPerson?: string;
        lastEditTime?: string;
        cardType?: string;    
        MVPN?: string;
        gender?: string;
        department?: string;
        costCenter?: string;
        area?: string;
        workArea?: string;
        registrationDate?: string;
        resignationDate?: string;
        carLicenseCategory?: string;
        cardLicense?: string;
        carLicense?: string;
        carLicense1?: string;
        carLicense2?: string;
        carLicense3?: string;    
        resignationNote?: string;
        resignationRecordCardRecord?: string;
        reasonForCard1?: string;
        historyForCard1?: string;
        dateForCard1?: string;
        reasonForCard2?: string;
        historyForCard2?: string;
        dateForCard2?: string;
        reasonForCard3?: string;
        historyForCard3?: string;
        dateForCard3?: string;
        reasonForApplication1?: string;
        dateForApplication1?: string;
        reasonForApplication2?: string;
        dateForApplication2?: string;
        reasonForApplication3?: string;
        dateForApplication3?: string;
        resignationRecordCarLicense?: string;    
        censusRecord1?: string;
        censusDate1?: string;
        censusRecord2?: string;
        censusDate2?: string;
        censusRecord3?: string;
        censusDate3?: string;
        infoOfViolation1?: string;
        dateOfViolation1?: string;
        infoOfViolation2?: string;
        dateOfViolation2?: string;
        infoOfViolation3?: string;
        dateOfViolation3?: string;
        status?:number;
        token?:string;
    
}
@registerSubclass()
export class LinearMember extends ParseObject<ILinearMember> { }

export interface ITimeSchedule {    // R daily V
    system?: number,                // 0: iSap 1: SiPass 2: CCure800
    timeid?: number,
    timename?: string,
    status?: number
}
@registerSubclass()
export class TimeSchedule extends ParseObject<ITimeSchedule> { }


// export interface IAccessGroup {
//     groupid?: string,
//     groupname?: string,
//     status?: number,
//     accesslevels?: AccessLevel[]
// }
// @registerSubclass()
// export class AccessGroup extends ParseObject<IAccessGroup> {}

export interface IAccessLevelinSiPass {     // CRUD  V
    token?: string,
    name?: string
}
@registerSubclass()
export class AccessLevelinSiPass extends ParseObject<IAccessLevelinSiPass> {}


export interface IAccessLevel {     // CRUD  V
    system?: number,                // 0: iSap 1: SiPass 2: CCure800
    type?: string,
    levelid?: string,
    levelidNumber?: number,
    levelname?: string,
    status?: number,
    door?: Door,
    doorgroup?: DoorGroup,
    elevator?: Elevator,
    elevatorgroup?: ElevatorGroup,
    floor?: Floor,
    floorgroup?:FloorGroup,
    timeschedule?: TimeSchedule
}
@registerSubclass()
export class AccessLevel extends ParseObject<IAccessLevel> { }
export interface CCurePermissionTable{
    permissionTableId:number;
    permissionTableName:string;
}

export interface IPermissionTable {     // CRUD  V
    system?: number,
    tableid?: number,
    tablename?: string,
    ccureToken?: string;
    sipassToken?: string;
    status?: number,
    accesslevels?: AccessLevel[]
}
@registerSubclass()
export class PermissionTable extends ParseObject<IPermissionTable> { }

export interface IPermissionTableDoor {     // CRUD  V
    system?: number,
    permissionTableId?: number,
    doorId?: number[],
    timespecId?: number;
    status?: number,
}
@registerSubclass()
export class PermissionTableDoor extends ParseObject<IPermissionTableDoor> { }



// export interface IAccessPolicy {    
//     system?: number,
//     ObjectToken?: string,
//     ObjectName?: string,
//     RuleToken?: string,
//     RuleType?: number,
//     TimeScheduleToken?: string,
//     StartDate?: string,
//     EndDate?: string,
//     ArmingRightsId?: string,
//     ControlModeId?: string,
//     Side?: number,
//     status?: number
// }
// @registerSubclass()
// export class AccessPolicy extends ParseObject<IAccessPolicy> { }



export interface ICredentialProfiles {     // R  V
    system?: number,
    Token?: string,
    Name?: string,
    PINDigits?: number,
    CardNumberDigits?: number,
    IsBase?: boolean,
    CardTechnology?: string,
    FacilityCode?: string,
    CardTechnologyCode?: number,
    ValidityCode?: string,
    IsUsed?: boolean,
    PinMode?: [
        {
            Type?: number,
            Name?: string,
            FullName?: string,
            IsUsed?: boolean
        }
    ],
    PINModeValue?: {
        Name?: string,
        FullName?: string
    }
}
@registerSubclass()
export class CredentialProfiles extends ParseObject<ICredentialProfiles> { }



export interface IWorkGroup {       // R  V
    system?: number,                // 1: SiPass
    groupid?: number,
    groupname?: string,
    // type: number,
    // accesspolicyrules: AccessPolicy[],
    status?: number
}
@registerSubclass()
export class WorkGroup extends ParseObject<IWorkGroup> { }

export interface ISyncReceiver {
    receivename?: string,
    emailaddress?: string,
    status?: number
}
// @registerSubclass()
// export class SyncReceiver extends ParseObject<ISyncReceiver> { }

export interface ISyncNotification {    // CRUD V
    receivers?: ISyncReceiver[]
}
@registerSubclass()
export class SyncNotification extends ParseObject<ISyncNotification> { }

export interface IvieMember {   // Sync Only Backup
    CompCode?: string,
    CompName?: string,
    EngName?: string,
    EmpName?: string,
    EmpNo?: string,
    Extension?: string,
    MVPN?: string,
    Cellular?: string,
    EMail?: string,
    Sex?: string,
    BirthDate?: string,
    DeptCode?: string,
    DeptChiName?: string,
    CostCenter?: string,
    LocationCode?: string,
    LocationName?: string,
    RegionCode?: string,
    RegionName?: string,
    EntDate?: string,
    OffDate?: string,
    SuppStartDate?: string,
    SuppEndDate?: string,
    UpdUser?: string,
    UpdDate?: string
}
@registerSubclass()
export class vieMember extends ParseObject<IvieMember> { }


export interface IAttendanceRecords {
    rowguid?: number,
    at_id?: number,
    date_occurred?: string,
    date_time_occurred?: Date,
    time_occurred?: string,
    server_name?: string,
    unit_no?: number,
    point_no?: number,
    type?: number,
    point_name?: string,
    date_recorded?: string,
    time_recorded?: string,
    category?: number,
    message?: string,
    state_id?: number,
    last_name?: string,
    first_name?: string,
    workgroup?: string,
    card_no?: string,
    udf1?: string,
    udf2?: string,
    udf3?: string,
    udf4?: string,
    udf5?: string,
    udf6?: string,
    udf7?: string,
    last_updated?: number,
    pt_id?: number,
    buss_name?: string,
    at_type?: number,
    date_occurred_server?: string,
    time_occurred_server?: string,
    fln_no?: number,
    device_no?: number,
    card_facility?: number,
    card_tech?: number,
    new_area?: number,
    old_area?: number,
    opg_id?: number,
    emp_id?: number,
    checksum?: string,
    archived?: number,
    member?:LinearMember,
    system?:number,
    door?:Door
}
@registerSubclass()
export class AttendanceRecords extends ParseObject<IAttendanceRecords> { }

export interface IDailyAttendance {
    cardNumber:string;
    dateOccurred:string;
    attendanceStart?:AttendanceRecords;
    attendanceEnd?:AttendanceRecords;
    member?:LinearMember;
    timeDifferent?:Date;
}
@registerSubclass()
export class DailyAttendance extends ParseObject<IDailyAttendance> { }

export interface IDropDownList {
    type: string,   // ProfileId, Certification, License, CreateReason1 , CreateReason2, CreateReason3, ApplyReason1, ApplyReason2, ApplyReason3
    key?: number,
    name?: string
}
@registerSubclass()
export class DropDownList extends ParseObject<IDropDownList> { }
