import {
    Action, Errors, Restful, ParseObject, ElevatorGroup, Elevator
} from 'core/cgi-package';

import { Log } from 'workspace/custom/services/log';
import { IFloor, Floor } from '../../custom/models'
import { LocationSite } from 'workspace/custom/models/db/location-site';
import { LocationArea } from 'workspace/custom/models/db/location-area';


var action = new Action({
    loginRequired: true,
    // permission: [RoleList.Admin, RoleList.SuperAdministrator, RoleList.SystemAdministrator],
    apiToken: "door_floor_CRUD"
});

/// CRUD start /////////////////////////////////
/********************************
 * C: create object
 ********************************/
type InputC = Restful.InputC<IFloor>;
type OutputC = Restful.OutputC<IFloor>;

action.post<InputC, OutputC>({ inputType: "InputC" }, async (data) => {
    /// 1) Create Object
    var obj = new Floor(data.inputType);

    Log.Info(`info`, `postFloor ${data.inputType.floorname}`, data.user);

    await obj.save(null, { useMasterKey: true });
    /// 2) Output
    return ParseObject.toOutputJSON(obj);
});

/********************************
 * R: get object
 ********************************/
type InputR = Restful.InputR<IFloor>;
type OutputR = Restful.OutputR<IFloor>;

action.get<InputR, OutputR>({ inputType: "InputR" }, async (data) => {
    /// 1) Make Query
    var query = new Parse.Query(Floor);
    /// 2) With Extra Filters
    let filter = data.parameters as any;

    let groupQuery = new Parse.Query(ElevatorGroup)
                    .include("elevators")
                    .include("area.site");
    
    if(filter.sitename){
        let siteQuery = new Parse.Query(LocationSite)
            .matches("name", new RegExp(filter.sitename), "i");
        let areaQuery = new Parse.Query(LocationArea)
            .matchesQuery("site", siteQuery);
        let groups = await groupQuery.matchesQuery("area", areaQuery)
            .limit(Number.MAX_SAFE_INTEGER)            
            .find();
        
        let floorIds = getFloorIds(groups);
        query.containedIn("objectId", floorIds);
    }
    if(filter.areaname){
        let areaQuery = new Parse.Query(LocationArea)
            .matches("name", new RegExp(filter.areaname), "i");
        let groups = await groupQuery.matchesQuery("area", areaQuery)
            .limit(Number.MAX_SAFE_INTEGER)
            .find();            
        
        let floorIds = getFloorIds(groups);
        query.containedIn("objectId", floorIds);
    }

    if(filter.groupname){        
        let groups = await groupQuery.matches("groupname", new RegExp(filter.groupname), "i")
            .limit(Number.MAX_SAFE_INTEGER)
            .find();        
        
            let floorIds = getFloorIds(groups);
            query.containedIn("objectId", floorIds);
    }
    if(filter.elevatorname){
        let elevators = await new Parse.Query(Elevator)
            .matches("elevatorname", new RegExp(filter.elevatorname), "i")
            .limit(Number.MAX_SAFE_INTEGER)
            .find();
        let floors = [];
        for(let elevator of elevators){
            if(elevator.get("reader"))floors.push(...elevator.get("reader"));            
        }
        
        let floorIds = floors.map(x=>ParseObject.toOutputJSON(x)).map(x=>x.objectId);        
        query.containedIn("objectId", floorIds);
    }
    if(filter.name){
        query.matches("floorname", new RegExp(filter.name), "i");
    }
    query = Restful.Filter(query, data.inputType);
    /// 3) Output
    return Restful.Pagination(query, data.parameters);
    
});

/********************************
 * U: update object
 ********************************/
type InputU = Restful.InputU<IFloor>;
type OutputU = Restful.OutputU<IFloor>;

action.put<InputU, OutputU>({ inputType: "InputU" }, async (data) => {
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query(Floor).get(objectId);
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [`Floor <${objectId}> not exists.`]);
    
    Log.Info(`info`, `putFloor ${obj.get("floorname")}`, data.user);

    /// 2) Modify
    await obj.save({ ...data.inputType, objectId: undefined });
    /// 3) Output
    return ParseObject.toOutputJSON(obj);
});

/********************************
 * D: delete object
 ********************************/
type InputD = Restful.InputD<IFloor>;
type OutputD = Restful.OutputD<IFloor>;

action.delete<InputD, OutputD>({ inputType: "InputD" }, async (data) => {
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query(Floor).get(objectId);
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [`Floor <${objectId}> not exists.`]);
    /// 2) Delete
    obj.destroy({ useMasterKey: true });
    /// 3) Output
    return ParseObject.toOutputJSON(obj);
});
/// CRUD end ///////////////////////////////////

export default action;
function getFloorIds(groups: ElevatorGroup[]) {
    let elevators = [];
    for (let group of groups) {
        elevators.push(...group.get("elevators"));
    }
    let floors = [];
    for(let elevator of elevators){
        if(elevator.get("reader"))floors.push(...elevator.get("reader"));            
    }
    let floorIds = floors.map(x => ParseObject.toOutputJSON(x)).map(x => x.objectId);
    return floorIds;
}