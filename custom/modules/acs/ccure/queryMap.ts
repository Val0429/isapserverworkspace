import { Config } from 'core/config.gen';
import { isNullOrUndefined } from "util";

/**
 * Use to specify query content
 */
export enum QueryContent {
    Reports,
    ReportsNewUpdate,
    ReportsLastUpdateTime,
    BadgeLayout,
    EnumFields,
    Persons,
    PersonExtendInfo,
    PersonExtendInfoEnumList,
    PersonPropList,
    Timespec,
    TimespecDays,
    Reader,
    Doors,
    Floor,
    Elevator,
    ElevatorFloor,
    Clearance,
    ClearPerson,
    ClearDoor,
    ClearDoorGroup,
    ClearElevatorFloor,
    DoorGroup,
    FloorGroup,
    ElevatorGroup,
    GroupMember,
    Users,
    ObjectList,
    Jnl_Directory
}

export interface IQueryParam {
    OnReceivedData?: Function;
    OnDone?: Function;
    OnError?: Function;
    table: string;
    selector: string;
    dsn ?: string;
    condition?: string;
    inner_selector?: string;
    left_join_on ?: string;
    left_join_table ?: string;
};

export interface IQueryMap {
    [key: number]: IQueryParam
}

var queryMap : IQueryMap = {};
{
    queryMap[QueryContent.Jnl_Directory] = {
        "table": "pub.jnl_Directory",
        "selector": "MAX(Volume) as volume",
        "dsn": Config.CCUREdsn.CFSRV
    }

    //ReportsLastUpdateTime
    queryMap[QueryContent.ReportsLastUpdateTime] = {
        "table": "pub.journ",
        "selector": "MAX(Host_DT) as updateTime",
        "condition": "Int_Data2 = 64 or Int_Data2 = 128"
    }

    //ReportsAll
    /**
     */
    queryMap[QueryContent.Reports] = {
        "table": "pub.journ",
        "selector":  'Jnl_ID as reportId,'+
                     'Int_Data2 as msgCode,'+
                     'User_PID as personId,'+
                     'Txt_Data2 as name,'+
                     'Int_Data4 as cardNumber,'+
                     'Int_Data1 as doorId,'+
                     'Host_DT as updateTime',
        "condition": "Int_Data2 = 64 or Int_Data2 = 128"
    }

    //ReportsNewUpdate
    queryMap[QueryContent.ReportsNewUpdate] = {
        "table": "pub.journ",
        "selector":  'Jnl_ID as reportId,'+
                     'Int_Data2 as msgCode,'+
                     'User_PID as personId,'+
                     'Txt_Data2 as name,'+
                     'Int_Data4 as cardNumber,'+
                     'Int_Data1 as doorId,'+
                     'Host_DT as updateTime',
        "condition": "Int_Data2 = 64 or Int_Data2 = 128"
    }

    

    //BadgeLayout
    queryMap[QueryContent.BadgeLayout] = {
        "table": "pub.badge_layout",
        "selector": 'Badge_Layout_ID as badgeLayoutId,'+
                    'Badge_Layout_Name as badgeLayoutName',
        "dsn": Config.CCUREdsn.CFSRV
    }

    //EnumFields
    queryMap[QueryContent.EnumFields] = {
        "table": "pub.field_enum_list",
        "selector": 'Field_ID as fieldId,'+
                    'Enum_List_Value as fieldValue,'+
                    'Enum_List_SeqID as seqId',
        "dsn": Config.CCUREdsn.CFSRV
    }

    //Person
    queryMap[QueryContent.Persons] = {
        "table": "ccm.view_person",
        "selector": 'PERSONID as personId,'+
                    'FIRSTNAME as firstName, '+
                    'MIDDLENAME as middleName, '+
                    'LASTNAME as lastName, '+
                    'TEXT1 as engName, '+
                    'TEXT2 as employeeNo,'+ 
                    'CARDNUM as cardNum,'+
                    'INT1 as fullCardNumber,'+
                    'INT3 as extensionPhoneNum,'+
                    'INT4 as MVPN,'+
                    'PIN as pin,' +
                    'BADGELAYOUTID as badgeLayoutId,' + 
                    'BADGEPRINTDT as badgePrintTime,' + 
                    'IMAGECAPTUREDT as imageCapturetime,' + 
                    'DELETED as deleted,' +
                    'LOST as lost,' + 
                    'ACTIVATIONDT as activationTime,'+
                    'EXPIRATIONDT as expirationTime,'+
                    'GLOBALLASTMODDT as updateTime,'+
                    'LASTMODPERSONID as updatedPerson',
        "dsn": Config.CCUREdsn.CFSRV,
    }

    //PersonExtendInfo
    queryMap[QueryContent.PersonExtendInfo] = {
        "table": "pub.person_field_values",
        "selector": 'Person_ID as personId,'+
                    'Field_Id as fieldId, '+
                    'Field_Name as fieldName, '+
                    'Char_Value as charVal, '+
                    'Decimal_Value as decimalVal',
        "inner_selector": `pub.person_field_values.Person_ID, `+
                          `pub.field_report_name.Field_Id, `+
                          `pub.field_report_name.Field_Name, `+
                          `Char_Value, `+
                          `cast(Decimal_Value as int) as Decimal_Value`,
        "left_join_table": "pub.field_report_name",
        "left_join_on": "pub.field_report_name.Field_ID = pub.person_field_values.Field_ID",
        "condition":"pub.field_report_name.language_idx = 1033",
        "dsn": Config.CCUREdsn.CFSRV,
    }

    //PersonExtendInfo
    queryMap[QueryContent.PersonExtendInfoEnumList] = {
        "table": "pub.field_enum_list",
        "selector": 'Field_ID as fieldId,'+
                    'Enum_List_Value as value, '+
                    'Deleted as deleted',
        "dsn": Config.CCUREdsn.CFSRV,
    }

    //PersonExtendInfo
    queryMap[QueryContent.PersonPropList] = {
        "table": "pub.field_report_name",
        "selector": 'Field_ID as fieldId,'+
                    'Field_Name as fieldName',
        "dsn": Config.CCUREdsn.CFSRV,
        "condition":"Language_idx=1033"
    }

    //Timespec
    queryMap[QueryContent.Timespec] = {
        "table": "ccm.view_timespec",
        "selector": 'TIMESPECID as timespecId,'+
                    'TIMESPECNAME as timespecName',
        "dsn": Config.CCUREdsn.CFSRV
    }

    //dayCode == 1 ~ 7 : 一二三四五六日
    //        == 8 : 一到五
    //        == 11 : 六到日
    //        == 1638, 1639 假日清單 (不知道從哪取對應資料)
    //Timespec Days
    queryMap[QueryContent.TimespecDays] = {
        "table": "pub.time_spec_Days",
        "selector": 'Time_Spec_ID as timespecId,'+
                    'Day_of_Week as dayCode,'+
                    'Start_Time as startTime,'+
                    'End_Time as endTime',
        "dsn": Config.CCUREdsn.CFSRV
    }

    //Reader
    queryMap[QueryContent.Reader] = {
        "table": "pub.reader",
        "selector": 'Reader_ID as deviceId,'+
                    'Reader_Name as deviceName,' +
                    'Related_Object_ID as doorId,' +
                    'Online as online,'+
                    'Description as description',
        "dsn": Config.CCUREdsn.CFSRV,
    }

    //Door
    queryMap[QueryContent.Doors] = {
        "table": "pub.door",
        "selector": 'Door_ID as doorId,'+
                    'Door_Name as doorName,' +
                    'Door_Has_RTE,' +
                    'Unlock_Door_on_RTE,' +
                    'Shunt_DSM_on_RTE,' +
                    'Continuously_Active,' +
                    'Relock_After_Open,' +
                    'Delay_Relock_Time,' +
                    'Unlock_Time as unlockTime,' +
                    'Shunt_Time as shuntTime,'+
                    'Description as description',
        "dsn": Config.CCUREdsn.CFSRV
    }

    //Floor
    queryMap[QueryContent.Floor] = {
        "table": "pub.floor",
        "selector": 'Floor_ID as floorId,'+
                    'Floor_Name as floorName,' +
                    'Online as online,' +
                    'Description as description',
        "dsn": Config.CCUREdsn.CFSRV
    }

    //Elevator
    queryMap[QueryContent.Elevator] = {
        "table": "pub.Elevator",
        "selector": 'Elevator_ID as elevatorId,'+
                    'Elevator_Name as elevatorName,' +
                    'Reader_ID as deviceId,' +
                    'Online as online,' +
                    'Description as description',
        "dsn": Config.CCUREdsn.CFSRV
    }

    //Elevator Floor
    queryMap[QueryContent.ElevatorFloor] = {
        "table": "pub.Elevator_floor",
        "selector": 'Elevator_Floor_ID as elevatorFloorId,'+
                    'Elevator_ID as elevatorId,'+
                    'Floor_ID as floorId,'+
                    'Deleted as deleted',
        "dsn": Config.CCUREdsn.CFSRV
    }

    //Clearance
    queryMap[QueryContent.Clearance] = {
        "table": "ccm.view_clearance",
        "selector": 'CLEARANCEID as permissionTableId,'+
                    'CLEARANCENAME as permissionTableName',
        "dsn": Config.CCUREdsn.CFSRV
    }

    //Clearance - Person
    queryMap[QueryContent.ClearPerson] = {
        "table": "ccm.view_clearperson",
        "selector": 'CLEARANCEID as permissionTableId,'+
                    'PERSONID as personId',
        "dsn": Config.CCUREdsn.CFSRV
    }

    //Clearance - Door
    queryMap[QueryContent.ClearDoor] = {
        "table": "ccm.view_clearpair",
        "selector": 'CLEARID as permissionTableId,'+
                    'CLEARTHRUOBJ as doorId,'+
                    'TIMESPECID as timespecId',
        "dsn": Config.CCUREdsn.CFSRV,
        "condition":"OBJECTTYPE=7"
    }

    //Clearance - DoorGroup
    queryMap[QueryContent.ClearDoorGroup] = {
        "table": "ccm.view_clearpair",
        "selector": 'CLEARID as permissionTableId,'+
                    'CLEARTHRUOBJ as groupId,'+
                    'TIMESPECID as timespecId',
        "dsn": Config.CCUREdsn.CFSRV,
        "condition":"OBJECTTYPE=8"
    }

    //Clearance - DoorGroup
    queryMap[QueryContent.ClearElevatorFloor] = {
        "table": "ccm.view_cleartriplet",
        "selector": 'CLEARID as permissionTableId,'+
                    'ELEVATORORGRPID as elevatorOrGroupId,'+
                    'FLOORORGRPID as floorOrGroupId,'+
                    'TIMESPECID as timespecId',
        "dsn": Config.CCUREdsn.CFSRV
    }

    //DoorGroup
    queryMap[QueryContent.DoorGroup] = {
        "table": "pub.groups",
        "selector": 'Group_ID as groupId,'+
                    'Group_Name as groupName',
        "dsn": Config.CCUREdsn.CFSRV,
        "condition": "Object_Type=8"
    }

    //DoorGroup
    queryMap[QueryContent.FloorGroup] = {
        "table": "pub.groups",
        "selector": 'Group_ID as groupId,'+
                    'Group_Name as groupName',
        "dsn": Config.CCUREdsn.CFSRV,
        "condition": "Object_Type=30"
    }

    //ElevatorGroup
    queryMap[QueryContent.ElevatorGroup] = {
        "table": "pub.groups",
        "selector": 'Group_ID as groupId,'+
                    'Group_Name as groupName',
        "dsn": Config.CCUREdsn.CFSRV,
        "condition": "Object_Type=28"
    }

    //Group_Member
    queryMap[QueryContent.GroupMember] = {
        "table": "pub.Group_Member",
        "selector": 'Group_ID as groupId,'+
                    'Object_Id as objectId',
        "dsn": Config.CCUREdsn.CFSRV
    }

    //User
    queryMap[QueryContent.Users] = {
        "table": "ccm.view_users",
        "selector": 'PERSONID as personId,'+
                    'USERNAME as userName,'+
                    'PASSWORD as password,'+
                    'ENABLED  as enabled,'+
                    'ODBCENABLED as ODBCEnabled',
        "dsn": Config.CCUREdsn.CFSRV
    }
    //Object List
    queryMap[QueryContent.ObjectList] = {
        "table": "ccm.view_objarchive",
        "selector": "OBJECTID as objId, NAME as objName, DELETED as isDeleted, OBJECTTYPE as objType",
        "dsn": Config.CCUREdsn.CFSRV
    }

    let keys = Object.keys(QueryContent).filter(key => !isNaN(Number(QueryContent[key])));
    for (let type in keys) {
        if (isNullOrUndefined(queryMap[type]))
            throw `Internal Error: <CCUREReader::setDefaultMap> Verify _queryMap fail, please check {QueryContent.${QueryContent[type]}} again`;
    }
}

export default queryMap;