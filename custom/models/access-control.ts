import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import { IDB } from './db';

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
    system: number,             // 0: iSap
    groupid: number,
    groupname: string,
    floors: Floor[],
    status: number
}
@registerSubclass()
export class FloorGroup extends ParseObject<IFloorGroup> { }

export interface IElevator {    // CRUD V
    system: number,             // 0: iSap 1: SiPass 2: CCure800
    elevatorid?: number,
    elevatorname: string,
    reader?: Floor[],
    status?: number
}
@registerSubclass()
export class Elevator extends ParseObject<IElevator> { }

export interface IDoorGroup {   // CRUD V
    system?: number,             // 0: iSap
    groupid?: number,
    groupname?: string,
    area?: IDB.LocationArea,
    doors?: Door[],
    status?: number
}
@registerSubclass()
export class DoorGroup extends ParseObject<IDoorGroup> { }

export interface IElevatorGroup {   // CRUD V
    system?: number,                 // 0: iSap 
    groupid?: number,
    groupname?: string,
    area?: IDB.LocationArea,
    elevators?: Elevator[],
    status?: number
}
@registerSubclass()
export class ElevatorGroup extends ParseObject<IElevatorGroup> { }

export interface IMember {      // CRUD
    system?: number,            // 0: iSap 4: FET
    Attributes?: {},
    Credentials?: {
        CardNumber?: string,
        EndDate?: string,
        Pin?: string,
        ProfileId?: number,
        ProfileName?: string,
        StartDate?: string,
        FacilityCode?: number,
        CardTechnologyCode?: number,
        PinMode?: number,
        PinDigit?: number
    }[],
    AccessRules?: any[],
    EmployeeNumber?: string,
    EndDate?: string,
    FirstName?: string,
    GeneralInformation?: string,
    LastName?: string,
    PersonalDetails?: {
        Address?: string,
        ContactDetails?: {
            Email?: string,
            MobileNumber?: string,
            MobileServiceProviderId?: string,
            PagerNumber?: string,
            PagerServiceProviderId?: string,
            PhoneNumber?: string
        },
        DateOfBirth?: string,
        PayrollNumber?: string,
        Title?: string,
        UserDetails?: {
            Password?: string,
            UserName?: string
        }
    },
    PrimaryWorkgroupId?: number,
    ApbWorkgroupId?: number,
    PrimaryWorkgroupName?: string,
    NonPartitionWorkGroups?: [],
    SmartCardProfileId?: string,
    StartDate?: string,
    Status?: number,
    Token?: string,
    TraceDetails?: {},
    // Vehicle1?: {},
    // Vehicle2?: {},
    Potrait?: string,
    PrimaryWorkGroupAccessRule?: [],
    NonPartitionWorkgroupAccessRules?: [],
    VisitorDetails?: {},
    CustomFields?: {
        FiledName?: string,
        FieldValue?: any
    }[],
    FingerPrints?: [],
    CardholderPortrait?: string
}
@registerSubclass()
export class Member extends ParseObject<IMember> { }


export interface ITimeSchedule {    // R daily V
    timeid?: string,                // 1: SiPass 2: CCure800
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

export interface IAccessLevel {     // CRUD  V
    system?: number                // 0: iSap 1: SiPass 2: CCure800
    type?: string,
    levelid?: string,
    levelname?: string,
    status?: number,
    door?: Door,
    doorgroup?: DoorGroup,
    elevator?: Elevator,
    elevatorgroup?: ElevatorGroup,
    reader?: Reader[],
    timeschedule?: TimeSchedule
}
@registerSubclass()
export class AccessLevel extends ParseObject<IAccessLevel> { }


export interface IPermissionTable {     // CRUD  V
    tableid?: string,
    tablename?: string,
    ccureToken?: string;
    sipassToken?: string;
    status?: number,
    accesslevels?: AccessLevel[]
}
@registerSubclass()
export class PermissionTable extends ParseObject<IPermissionTable> { }


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


export interface IWorkGroup {       // R  V
    system?: number,                // 1: SiPass
    groupid?: string,
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
    archived?: number
}
@registerSubclass()
export class AttendanceRecords extends ParseObject<IAttendanceRecords> { }


export interface IProfileId {   // Credentials.ProfileId
    profileid: number;
    name?: string               // 35 bit, 26 bit, ???
}
@registerSubclass()
export class ProfileId extends ParseObject<IProfileId> { }


export interface ICardProfile { // 正卡類型   CustomDropdownControl1__CF
    name?: string               // 正職, ASR臨時卡, DOC臨時卡
}
@registerSubclass()
export class CardProfile extends ParseObject<ICardProfile> { }

