import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors, Cameras, ICameras,
    Restful, FileHelper, ParseObject, TimeSchedule, Door, AccessLevel, DoorGroup
} from 'core/cgi-package';

import { IPermissionTable, PermissionTable } from '../../custom/models'
import { siPassAdapter } from '../../custom/services/acsAdapter-Manager';

import { Log } from 'helpers/utility';
import * as delay from 'delay';

var action = new Action({
    loginRequired: true,
    // permission: [RoleList.Admin, RoleList.SuperAdministrator, RoleList.SystemAdministrator],
    apiToken: "3-3_door_permissiontable_CRUD"
});

/// CRUD start /////////////////////////////////
/********************************
 * C: create object
 ********************************/
type InputC = Restful.InputC<IPermissionTable>;
type OutputC = Restful.OutputC<IPermissionTable>;

action.post<InputC, OutputC>({ inputType: "InputC" }, async (data) => {
    /// 1) Check data.inputType
    // if ( (siPassAdapter.sessionToken == undefined) || (siPassAdapter.sessionToken == "") ) {
    //     Log.Info(`CGI acsSync`, `SiPass Connect fail. Please contact system administrator!`);
    //     throw Errors.throw(Errors.CustomNotExists, [`SiPass Connect fail. Please contact system administrator!`]);
    // }

    /// 2) Create Object
    let name = data.inputType.tablename ;
    let nameObject = await new Parse.Query(PermissionTable).equalTo("tablename", name).first();
    if ( nameObject != null) {
        throw Errors.throw(Errors.CustomNotExists, [`Permssion table name is duplicate.`]);
    }

    // 2.0 Modify Access Group
    
    let al = [];

    if (data.inputType.accesslevels) {
        for (let i = 0; i < data.inputType.accesslevels.length; i++) {
            let levelGroup = data.inputType.accesslevels[i];

            for (let j = 0; j < levelGroup.get("levelinSiPass").length; j++) {
                al.push(levelGroup.get("levelinSiPass")[j]);    
            }
        }
    }
    let ag = {
        token: "-1",
        name: data.inputType.tablename,
        accessLevels: al
    };

    Log.Info(`${this.constructor.name}`, `Sync to SiPass ${ JSON.stringify(ag) }`);
    let r1 = await siPassAdapter.postAccessGroup(ag);

    data.inputType.tableid = r1["Token"];
    var obj = new PermissionTable(data.inputType);
    await obj.save(null, { useMasterKey: true });
    
    Log.Info(`${this.constructor.name}`, `postPermisiionTable ${data.inputType.tableid} ${data.inputType.tablename}`);

    for (let i = 0; i < al.length; i++) {
        const e = al[i];

        let ccure = await new Parse.Query(AccessLevel).equalTo("name", e["name"]).equalTo("system", 2).first();

        if (ccure == null)
            throw Errors.throw(Errors.CustomBadRequest, [`Access level not in ccure. ${e["name"]}`]);
    }

    /// 2) Output
    return ParseObject.toOutputJSON(obj);
});

/********************************
 * R: get object
 ********************************/
type InputR = Restful.InputR<IPermissionTable>;
type OutputR = Restful.OutputR<IPermissionTable>;

action.get<InputR, OutputR>({ inputType: "InputR" }, async (data) => {
    /// 1) Make Query
    var query = new Parse.Query(PermissionTable)
        .include("accesslevels.door")
        .include("accesslevels.doorgroup")
        .include("accesslevels.timeschedule")
        .include("accesslevels.reader");

    let filter = data.parameters as any;
    if(filter.name){
        query.matches("tablename", new RegExp(filter.name), "i");
    }
    if(filter.timename){
        let tsQuery = new Parse.Query(TimeSchedule).matches("timename", new RegExp(filter.timename), "i");    
        let alQuery = new Parse.Query(AccessLevel).matchesQuery("timeschedule", tsQuery);    
        query.matchesQuery("accesslevels", alQuery);
    }
    if(filter.doorname){
        let doorQuery = new Parse.Query(Door).matches("doorname", new RegExp(filter.doorname), "i");    
        let alQuery = new Parse.Query(AccessLevel).matchesQuery("door", doorQuery);
        query.matchesQuery("accesslevels", alQuery);
    }
    if(filter.doorgroupname){
        let dgQuery = new Parse.Query(DoorGroup).matches("groupname", new RegExp(filter.doorgroupname), "i");    
        let alQuery = new Parse.Query(AccessLevel).matchesQuery("doorgroup", dgQuery);
        query.matchesQuery("accesslevels", alQuery);
    }
    /// 2) With Extra Filters
    query = Restful.Filter(query, data.inputType);
    /// 3) Output
    return Restful.Pagination(query, data.parameters);
});

/********************************
 * U: update object
 ********************************/
type InputU = Restful.InputU<IPermissionTable>;
type OutputU = Restful.OutputU<IPermissionTable>;

action.put<InputU, OutputU>({ inputType: "InputU" }, async (data) => {
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query(PermissionTable).get(objectId);
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [`PermissionTable <${objectId}> not exists.`]);
    
    Log.Info(`${this.constructor.name}`, `putPermissionTable ${obj.get("tableid")} ${obj.get("tablename")}`);

    /// 2) Modify
    await obj.save({ ...data.inputType, objectId: undefined });

    // 2.0 Modify Access Group
    {
        let al = [];
        if (data.inputType.accesslevels) {
            for (let i = 0; i < data.inputType.accesslevels.length; i++) {
                let level = ParseObject.toOutputJSON(data.inputType.accesslevels[i]);

                let ar = [];
                if (level["readers"]) {
                    for (let j = 0; j < level["readers"].length; j++) {
                        // check access level exists
                        const r = level["readers"][j];

                        ar.push({ ObjectToken: r["readerid"], ObjectName: r["readername"] + "_" + level["timeschedule"]["timename"], RuleToken: 12, RuleType: 3 });
                    }

                    al.push({
                        name: level["levelname"],
                        token: level["levelid"],
                        accessRule: ar,
                        timeScheduleToken: level["timeschedule"]["timeid"]
                    });

                    let d = {
                        name: level["levelname"],
                        token: level["levelid"],
                        accessRule: ar,
                        timeScheduleToken: level["timeschedule"]["timename"]
                    };
    
                    //await siPassAdapter.postAccessLevel(d);
                }
            }
        }

        let ag = {
            token: data.inputType.tableid + "",
            name: data.inputType.tablename,
            accessLevels: al
        };

        Log.Info(`${this.constructor.name}`, `Sync to SiPass ${ag}`);
        //await siPassAdapter.putAccessGroup(ag);

        for (let i = 0; i < al.length; i++) {
            const e = al[i];

            let ccure = await new Parse.Query(AccessLevel).equalTo("name", e["name"]).equalTo("system", 2).first();

            if (ccure == null)
                throw Errors.throw(Errors.CustomBadRequest, [`Access level not in ccure. ${e["name"]}`]);
        }
    }

    /// 3) Output
    return ParseObject.toOutputJSON(obj);
});

/********************************
 * D: delete object
 ********************************/
type InputD = Restful.InputD<IPermissionTable>;
type OutputD = Restful.OutputD<IPermissionTable>;

action.delete<InputD, OutputD>({ inputType: "InputD" }, async (data) => {
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query(PermissionTable).get(objectId);
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [`PermissionTable <${objectId}> not exists.`]);
    
    Log.Info(`${this.constructor.name}`, `deletePermissionTable ${obj.get("tableid")} ${obj.get("tablename")}`);

    /// 2) Delete
    obj.destroy({ useMasterKey: true });
    /// 3) Output
    return ParseObject.toOutputJSON(obj);
});
/// CRUD end ///////////////////////////////////

export default action;
