import {
    Action, Errors, Restful, ParseObject, TimeSchedule, Door, AccessLevelinSiPass
} from 'core/cgi-package';

import { Log } from 'workspace/custom/services/log';
import { IAccessLevel, AccessLevel, DoorGroup, Floor, FloorGroup, Elevator, ElevatorGroup } from '../../custom/models'
import { siPassAdapter } from '../../custom/services/acsAdapter-Manager';

var action = new Action({
    loginRequired: true,
    // permission: [RoleList.Admin, RoleList.SuperAdministrator, RoleList.SystemAdministrator],
    apiToken: "door_accesslevel_CRUD"
});

/// CRUD start /////////////////////////////////
/********************************
 * C: create object
 ********************************/
type InputC = Restful.InputC<IAccessLevel>;
type OutputC = Restful.OutputC<IAccessLevel>;

action.post<InputC, OutputC>({ inputType: "InputC" }, async (data) => {
    /// 1) Sync to ACS Services
    //console.log("bop0");
    let { readers, floors, doors } = await getAccessLevelReaders(ParseObject.toOutputJSON(data.inputType));
    // if ((siPassAdapter.sessionToken == undefined) || (siPassAdapter.sessionToken == "")) {
    //     Log.Info(`CGI acsSync`, `SiPass Connect fail. Please contact system administrator!`);
    //     throw Errors.throw(Errors.CustomNotExists, [`SiPass Connect fail. Please contact system administrator!`]);
    // }

    // = = = RuleType = = = =
    // Unknown = 0
    // AccessPointGroup = 1
    // AccessPoint = 2
    // AccessLevel = 3
    // AccessGroup = 4
    // ExternalAreaPointGroup = 5
    // ExternalAreaPoint = 6
    // FloorPointGroup = 7
    // FloorPoint = 8
    // IntrusionAreaPointGroup = 9
    // IntrusionAreaPoint = 10
    // OfflineAccessGroup = 11
    // VenueBooking = 12
    //console.log("bop1");
    if (readers.length > 0) {
        //console.log("bop2");
        for (let e of readers) {            

            if (e.get("system") != 1) continue;
                let readername = e.get("readername");
                if(readername.substring(0, 2)=="A_") readername = readername.substring(2, readername.length);
                //console.log("bop2", readername);
                let r = {
                    Token: "-1",
                    Name: readername + "_" + data.inputType.timeschedule.get("timename"),
                    TimeScheduleToken: data.inputType.timeschedule.get("timeid"),
                    AccessRule: [
                        {
                            ObjectName: readername,
                            ObjectToken: e.get("readerid"),
                            RuleToken: e.get("readerid"),
                            RuleType: 2
                        }
                    ]
                }
                let exists = await new Parse.Query(AccessLevelinSiPass).equalTo("name", r.Name).first();
                if(!exists){
                    let r1 = await siPassAdapter.postAccessLevel(r);
                    //console.log("bop3");
                    if (r1["Token"] != undefined) {
                        await Log.Info(`create`, `${r1["Token"]} ${r1["Name"]}`, data.user, false, "AccessLevelinSiPass");

                        var obj1 = new AccessLevelinSiPass({ token: r1["Token"], name: r1["Name"] });
                        await obj1.save(null, { useMasterKey: true });
                    }
                    else {
                        throw Errors.throw(Errors.CustomNotExists, [`Create Access Level Fail ${r1}`]);
                    }
                }
            
        }
    }

    if (floors.length > 0) {
        for (let e of floors) {
            
            if (e.get("system") != 1) continue;
            let readername = e.get("floorname");
            if(readername.substring(0, 2)=="A_") readername = readername.substring(2, readername.length);
            let r = {
                Token: "-1",
                Name: readername + "_" + data.inputType.timeschedule.get("timename"),
                TimeScheduleToken: data.inputType.timeschedule.get("timeid"),
                AccessRule: [
                    {
                        ObjectName: readername,
                        ObjectToken: e.get("floorid"),
                        RuleToken: e.get("floorid"),
                        RuleType: 8
                    }
                ]
            }
            let exists = await new Parse.Query(AccessLevelinSiPass).equalTo("name", r.Name).first();
            if(!exists){
                let r1 = await siPassAdapter.postAccessLevel(r);
                if (r1["Token"] != undefined) {
                    await Log.Info(`create`, `${r1["Token"]} ${r1["Name"]}`, data.user, false, "AccessLevelinSiPass");

                    var obj1 = new AccessLevelinSiPass({ token: r1["Token"], name: r1["Name"] });
                    await obj1.save(null, { useMasterKey: true });
                }
                else {
                    throw Errors.throw(Errors.CustomNotExists, [`Create Access Level Fail ${r1}`]);
                }
            }
            
        }
    }

    /// 1) Create Object
    let firstObj = await new Parse.Query(AccessLevel).descending("levelidNumber").first();
    let max = 0;
    if (firstObj && firstObj.get("levelidNumber") >=0){
        max = firstObj.get("levelidNumber") + 1;
    }
        
    data.inputType.levelid = max + "";
    data.inputType.levelidNumber=max;
    data.inputType.levelname = "name " + data.inputType.levelidNumber;

    var obj = new AccessLevel(data.inputType);
    obj.set("doors", doors);
    
    await obj.save(null, { useMasterKey: true });
    await Log.Info(`create`, `${data.inputType.levelidNumber} ${data.inputType.levelname }`, data.user, false, "AccessLevel");
    /// 3) Output
    return ParseObject.toOutputJSON(obj);
});

/********************************
 * R: get object
 ********************************/
type InputR = Restful.InputR<IAccessLevel>;
type OutputR = Restful.OutputR<IAccessLevel>;

action.get<InputR, OutputR>({ inputType: "InputR" }, async (data) => {
    /// 1) Make Query
    var query = new Parse.Query(AccessLevel);
    /// 2) With Extra Filters
    query = Restful.Filter(query, data.inputType);

    let filter = data.parameters as any;
    if (filter.timename) {
        let tsQuery = new Parse.Query(TimeSchedule).matches("timename", new RegExp(filter.timename), "i");
        query.matchesQuery("timeschedule", tsQuery);
    }
    if (filter.doorname) {
        let tsDoor = new Parse.Query(Door).matches("doorname", new RegExp(filter.doorname), "i");
        query.matchesQuery("door", tsDoor);
    }
    /// 3) Output
    return Restful.Pagination(query, data.parameters);
});

/********************************
 * D: delete object
 ********************************/
type InputD = Restful.InputD<IAccessLevel>;
type OutputD = Restful.OutputD<IAccessLevel>;

action.delete<InputD, OutputD>({ inputType: "InputD" }, async (data) => {
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query(AccessLevel).get(objectId);
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [`AccessLevel <${objectId}> not exists.`]);
    /// 2) Delete

    await obj.destroy({ useMasterKey: true });
    
    await Log.Info(`delete`, `${obj.get("levelid")} ${obj.get("levelname")}`, data.user, false, "AccessLevel");
    /// 3) Output
    return ParseObject.toOutputJSON(obj);
});
/// CRUD end ///////////////////////////////////

export default action;
export async function getAccessLevelReaders(accessLevel:any) {
    //console.log("access level", accessLevel);
    let readers = [];
    let floors = [];
    let doors=[];
    if (accessLevel.type == "door") {
        let door = await new Parse.Query(Door)
            .equalTo("objectId", accessLevel.door.objectId)
            .include("readerout")
            .include("readerin")
            .first();
        doors.push(door);
        if (door.get("readerin"))
            readers.push(...door.get("readerin"));
        if (door.get("readerout"))
            readers.push(...door.get("readerout"));
    }
    else if (accessLevel.type == "doorGroup") {
        let doorGroup = await new Parse.Query(DoorGroup)
            .equalTo("objectId", accessLevel.doorgroup.objectId)
            .include("doors.readerin")
            .include("doors.readerout")
            .first();
        for (let door of doorGroup.get("doors")) {
            doors.push(door);
            if (door.get("readerin"))
                readers.push(...door.get("readerin"));
            if (door.get("readerout"))
                readers.push(...door.get("readerout"));
        }
    }    
    else if (accessLevel.type == "floor" || accessLevel.type == "elevatorGroup") {
        let floor = await new Parse.Query(Floor)
            .equalTo("objectId", accessLevel.floor.objectId)
            .first();
        floors.push(floor);
    }
    else if (accessLevel.type == "floorGroup" || accessLevel.type=="elevatorFloorGroup") {
        let floorGroup = await new Parse.Query(FloorGroup)
            .equalTo("objectId", accessLevel.floorgroup.objectId)
            .include("floors")
            .first();
        floors.push(...floorGroup.get("floors"));
    }
    return { readers, floors, doors };
}

