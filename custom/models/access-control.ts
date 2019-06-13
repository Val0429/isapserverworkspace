import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';

export interface IDoor {
    system?: number,
    doorid?: number,
    doorname?: string
    unlocktime?: string,
    shunttime?: string,
    status?: number
}
@registerSubclass()
export class Door extends ParseObject<IDoor> {}

export interface IElevator {
    system?: number,
    elevatorid?: number,
    floor?: number,
    unlocktime?: string,
    shunttime?: string,
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


export interface IMember {
    memberid?: string,
    firstname?: string,
    middlename?: string,
    lastname?: string,
    status?: number,    
    cardnNum?: string
}
@registerSubclass()
export class Member extends ParseObject<IMember> {}


export interface ISchedule {
    weekday?: number,
    starttime?: string,
    endtime?: string
}

export interface ITimeSchedule {
    timeid?: string,
    timename?: string,
    status?: number,
    schedule: ISchedule[]
}
@registerSubclass()
export class TimeSchedule extends ParseObject<ITimeSchedule> {}

export interface IPermissionTable {
    tableid?: string,
    tablename?: string,
    status?: number,
    member?: Member[],
    timeschedule?: TimeSchedule[],
}
@registerSubclass()
export class PermissionTable extends ParseObject<IPermissionTable> {}
