import {
    Action, Errors, Restful, ParseObject, Door, DoorGroup
} from 'core/cgi-package';

import { Log } from 'workspace/custom/services/log';
import { IReader, Reader } from '../../custom/models'
import { LocationArea, LocationSite } from 'workspace/custom/models/db/_index';


var action = new Action({
    loginRequired: true,
    // permission: [RoleList.Admin, RoleList.SuperAdministrator, RoleList.SystemAdministrator],
    apiToken: "door_reader_CRUD"
});

/// CRUD start /////////////////////////////////
/********************************
 * C: create object
 ********************************/
type InputC = Restful.InputC<IReader>;
type OutputC = Restful.OutputC<IReader>;

action.post<InputC, OutputC>({ inputType: "InputC" }, async (data) => {
    /// 1) Create Object
    var obj = new Reader(data.inputType);

    Log.Info(`${this.constructor.name}`, `postReader ${data.inputType.readerid} ${data.inputType.readername}`);

    await obj.save(null, { useMasterKey: true });
    /// 2) Output
    return ParseObject.toOutputJSON(obj);
});

/********************************
 * R: get object
 ********************************/
type InputR = Restful.InputR<IReader>;
type OutputR = Restful.OutputR<IReader>;

action.get<InputR, OutputR>({ inputType: "InputR" }, async (data) => {
    /// 1) Make Query
    var query = new Parse.Query(Reader);
    let filter = data.parameters as any;

    let groupQuery = new Parse.Query(DoorGroup);
    
    if(filter.sitename){
        let siteQuery = new Parse.Query(LocationSite)
            .matches("name", new RegExp(filter.sitename), "i");
        let areaQuery = new Parse.Query(LocationArea)
            .matchesQuery("site", siteQuery);
        let groups = await groupQuery.matchesQuery("area", areaQuery)
            .limit(Number.MAX_SAFE_INTEGER)
            .include("doors")
            .include("area.site")
            .find();

        let readerIds = getReaderIds(groups);
        query.containedIn("objectId", readerIds);
    }
    if(filter.areaname){
        let areaQuery = new Parse.Query(LocationArea)
            .matches("name", new RegExp(filter.areaname), "i");
        let groups = await groupQuery.matchesQuery("area", areaQuery)
            .limit(Number.MAX_SAFE_INTEGER)
            .include("doors")
            .include("area")
            .find();            
        
        let readerIds = getReaderIds(groups);
        query.containedIn("objectId", readerIds);
    }

    if(filter.doorgroup){        
        let groups = await groupQuery.matches("groupname", new RegExp(filter.doorgroup), "i")
            .limit(Number.MAX_SAFE_INTEGER)
            .include("doors")
            .find();        
        
        let readerIds = getReaderIds(groups);        
        query.containedIn("objectId", readerIds);
    }

    if(filter.doorname){
        let doors = await new Parse.Query(Door)
            .matches("doorname", new RegExp(filter.doorname), "i")
            .limit(Number.MAX_SAFE_INTEGER)
            .find();
        let doorreaders = [];
        for(let door of doors){
            if(door.get("readerin"))doorreaders.push(...door.get("readerin"));
            if(door.get("readerout"))doorreaders.push(...door.get("readerout"));
        }
        
        let readerIds = doorreaders.map(x=>ParseObject.toOutputJSON(x)).map(x=>x.objectId);        
        query.containedIn("objectId", readerIds);
    }
    if(filter.readerIO){
        let doors = await new Parse.Query(Door)            
            .limit(Number.MAX_SAFE_INTEGER)
            .find();
        let doorreaders = [];
        for(let door of doors){
            if(filter.readerIO =="IN" && door.get("readerin"))doorreaders.push(...door.get("readerin"));
            if(filter.readerIO =="OUT" && door.get("readerout"))doorreaders.push(...door.get("readerout"));
        }
        
        let readerIds = doorreaders.map(x=>ParseObject.toOutputJSON(x)).map(x=>x.objectId);        
        query.containedIn("objectId", readerIds);
    }
    if(filter.name){
        query.matches("readername", new RegExp(filter.name), "i");
    }
    if(filter.vacant && filter.vacant=="true"){
        let doors = await new Parse.Query(Door)
            .limit(Number.MAX_SAFE_INTEGER)
            .find();
        
        let usedreaders=[];
        for (let door of doors.map(x=>ParseObject.toOutputJSON(x))){
            if(door.readerin)usedreaders.push(...door.readerin);
            if(door.readerout)usedreaders.push(...door.readerout);
        }
        query.notContainedIn("objectId", usedreaders.map(x=>x.objectId));
    }
    /// 2) With Extra Filters
    query = Restful.Filter(query, data.inputType);
    /// 3) Output
    return Restful.Pagination(query, data.parameters);
});

/********************************
 * U: update object
 ********************************/
type InputU = Restful.InputU<IReader>;
type OutputU = Restful.OutputU<IReader>;

action.put<InputU, OutputU>({ inputType: "InputU" }, async (data) => {
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query(Reader).get(objectId);
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [`Reader <${objectId}> not exists.`]);

    Log.Info(`${this.constructor.name}`, `putReader ${obj.get("readerid")} ${obj.get("readername")}`);

    /// 2) Modify
    await obj.save({ ...data.inputType, objectId: undefined });
    /// 3) Output
    return ParseObject.toOutputJSON(obj);
});

/********************************
 * D: delete object
 ********************************/
type InputD = Restful.InputD<IReader>;
type OutputD = Restful.OutputD<IReader>;

action.delete<InputD, OutputD>({ inputType: "InputD" }, async (data) => {
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query(Reader).get(objectId);
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [`Reader <${objectId}> not exists.`]);
    
    Log.Info(`${this.constructor.name}`, `deleteReader ${obj.get("readerid")} ${obj.get("readername")}`);
    
    /// 2) Delete
    obj.destroy({ useMasterKey: true });
    /// 3) Output
    return ParseObject.toOutputJSON(obj);
});
/// CRUD end ///////////////////////////////////

export default action;
function getReaderIds(groups: DoorGroup[]) {
    let doors = [];
    for (let group of groups) {
        doors.push(...group.get("doors"));
    }
    let doorreaders = [];
    for (let door of doors) {
        if (door.get("readerin"))
            doorreaders.push(...door.get("readerin"));
        if (door.get("readerout"))
            doorreaders.push(...door.get("readerout"));
    }
    let readerIds = doorreaders.map(x => ParseObject.toOutputJSON(x)).map(x => x.objectId);
    return readerIds;
}

