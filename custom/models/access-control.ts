import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';

export interface IReader {
    system?: number,
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
    readerin: Floor,
    readerout: Floor,
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
@registerSubclass()
export class SyncReceiver extends ParseObject<ISyncReceiver> {}


export interface ISyncNotification {
    receivers?: SyncReceiver[]
}
@registerSubclass()
export class SyncNotification extends ParseObject<ISyncNotification> {}