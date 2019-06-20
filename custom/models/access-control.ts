import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';

export interface IReader {
    system?: number,        // 1: SiPass 2: CCure800
    readerid?: number,
    readername?: string,
    ccureid:number,
    ccurename:string,
    sipassid:number,
    sipassname:string,
    status?: number
}
@registerSubclass()
export class Reader extends ParseObject<IReader> {}

export interface IDoor {
    system?: number,
    doorid?: number,
    doorname?: string,
    readerin: Reader,
    readerout: Reader,
    status?: number    
}
@registerSubclass()
export class Door extends ParseObject<IDoor> {}

export interface IFloor {
    system?: number,
    floorid?: number,
    floorname?: string,
    ccureid:number,
    ccurename:string,
    sipassid:number,
    sipassname:string,
    status?: number
}
@registerSubclass()
export class Floor extends ParseObject<IFloor> {}

export interface IElevator {
    system?: number,
    elevatorid?: number,
    elevatorname?: string,
    reader: Floor[],
    status?: number
}
@registerSubclass()
export class Elevator extends ParseObject<IElevator> {}

export interface IDoorGroup {
    groupid?: number,
    groupname?: string,
    status?: number,
    doors?: Door[]
}
@registerSubclass()
export class DoorGroup extends ParseObject<IDoorGroup> {}

export interface IElevatorGroup {
    groupid?: number,
    groupname?: string,
    status?: number,
    elevators?: Elevator[]
}
@registerSubclass()
export class ElevatorGroup extends ParseObject<IElevatorGroup> {}

export interface IMember {
    system?: number,    
    Attributes?: {},
    Credentials?: [],
    AccessRules?: [],
    EmployeeNumber?: string,
    EndDate?: string,
    FirstName?: string,
    GeneralInformation?: string,
    LastName?: string,
    PersonalDetails?: {},
    PrimaryWorkgroupId?: number,
    ApbWorkgroupId?: number,
    PrimaryWorkgroupName?: string,
    NonPartitionWorkGroups?: [],
    SmartCardProfileId?: string,
    StartDate?: string,
    Status?: number,
    Token?: string,
    TraceDetails?: {},
    Vehicle1?: {},
    Vehicle2?: {},
    Potrait?: string,
    PrimaryWorkGroupAccessRule?: [],
    NonPartitionWorkgroupAccessRules?: [],
    VisitorDetails?: {},
    CustomFields?: [],
    FingerPrints?: [],
    CardholderPortrait?: string
}
@registerSubclass()
export class Member extends ParseObject<IMember> {}


export interface ITimeSchedule {
    timeid?: string,
    timename?: string,
    status?: number
}
@registerSubclass()
export class TimeSchedule extends ParseObject<ITimeSchedule> {}


// export interface IAccessGroup {
//     groupid?: string,
//     groupname?: string,
//     status?: number,
//     accesslevels?: AccessLevel[]
// }
// @registerSubclass()
// export class AccessGroup extends ParseObject<IAccessGroup> {}

export interface IAccessLevel {
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
export class AccessLevel extends ParseObject<IAccessLevel> {}


export interface IPermissionTable {
    tableid?: string,
    tablename?: string,
    status?: number,
    accesslevels?: AccessLevel[]
}
@registerSubclass()
export class PermissionTable extends ParseObject<IPermissionTable> {}


export interface IAccessPolicy {
    system?: number,
    ObjectToken?: string,
    ObjectName?: string,
    RuleToken?: string,
    RuleType?: number,
    TimeScheduleToken?: string,
    StartDate?: string,
    EndDate?: string,
    ArmingRightsId?: string,
    ControlModeId?: string,
    Side?: number,
    status?: number
}
@registerSubclass()
export class AccessPolicy extends ParseObject<IAccessPolicy> {}


export interface IWorkGroup {
    system?: number,
    groupid?: string,
    groupname?: string,
    type: number,
    accesspolicyrules: AccessPolicy[],
    status?: number
}
@registerSubclass()
export class WorkGroup extends ParseObject<IWorkGroup> {}

export interface ISyncReceiver {
    receivename?: string,
    emailaddress?: string
}

export interface ISyncNotification {
    "receivers"?: ISyncReceiver[]
}
@registerSubclass()
export class SyncNotification extends ParseObject<ISyncNotification> {}

export interface IvieMember {
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
export class vieMember extends ParseObject<IvieMember> {}


export interface IAttendanceRecords{
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
export class AttendanceRecords extends ParseObject<IAttendanceRecords> {}
    