import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors, Cameras, ICameras,
    Restful, FileHelper, ParseObject
} from 'core/cgi-package';

import { IPermissionTable, PermissionTable } from '../../custom/models'
import { siPassAdapter } from '../../custom/services/acsAdapter-Manager';

import { Log } from 'helpers/utility';
import * as delay from 'delay';

var action = new Action({
    loginRequired: false,
    permission: [RoleList.Admin, RoleList.SuperAdministrator, RoleList.SystemAdministrator]
});

/// CRUD start /////////////////////////////////
/********************************
 * C: create object
 ********************************/
type InputC = Restful.InputC<IPermissionTable>;
type OutputC = Restful.OutputC<IPermissionTable>;

action.post<InputC, OutputC>({ inputType: "InputC" }, async (data) => {
    /// 1) Create Object

    let firstObject = await new Parse.Query(PermissionTable).descending("tableid").first();
    let maxId = firstObject.get("tableid");
    data.inputType.tableid = maxId + 1;

    var obj = new PermissionTable(data.inputType);
    await obj.save(null, { useMasterKey: true });

    // 2.0 Modify Access Group
    {
        let al = [];

        if (data.inputType.accesslevels) {
            for (let i = 0; i < data.inputType.accesslevels.length; i++) {
                let level = ParseObject.toOutputJSON(data.inputType.accesslevels[i]);

                let ar = [];
                if (level["readers"]) {
                    for (let j = 0; j < level["readers"].length; j++) {
                        const r = level["readers"][j];

                        ar.push({ ObjectToken: r["readerid"], ObjectName: r["readername"], RuleToken: 12, RuleType: 2 });
                    }

                    al.push({
                        name: level["levelid"],
                        token: level["levelname"],
                        accessRule: ar,
                        timeScheduleToken: level["timeschedule"]["timeid"]
                    });
                }
            }
        }
        let ag = {
            token: data.inputType.tableid,
            name: data.inputType.tablename,
            accessLevels: al
        };

        Log.Info(`${this.constructor.name}`, `Sync to SiPass ${ag}`);
        await siPassAdapter.postAccessGroup(ag);


        // compare access level with ccure 800 and alarm
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
        .include("accesslevels")
        .include("accesslevels.timeschedule")
        .include("accesslevels.reader");


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

                        ar.push({ ObjectToken: r["readerid"], ObjectName: r["readername"] + "_" + level["timeschedule"]["timename"] , RuleToken: 12, RuleType: 2 });
                    }

                    al.push({
                        name: level["levelid"],
                        token: level["levelname"],
                        accessRule: ar,
                        timeScheduleToken: level["timeschedule"]["timeid"]
                    });

                    // push access level to sipass
                    
                }
            }
        }

        let ag = {
            token: data.inputType.tableid,
            name: data.inputType.tablename,
            accessLevels: al
        };

        Log.Info(`${this.constructor.name}`, `Sync to SiPass ${ag}`);
        await siPassAdapter.putAccessGroup(ag);
    }

    // compare access level with ccure 800 and alarm
    // door name and time name
    // door group  ==> door name





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
    /// 2) Delete
    obj.destroy({ useMasterKey: true });
    /// 3) Output
    return ParseObject.toOutputJSON(obj);
});
/// CRUD end ///////////////////////////////////

export default action;
