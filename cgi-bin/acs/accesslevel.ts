import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors, Cameras, ICameras,
    Restful, FileHelper, ParseObject, TimeSchedule, Door, AccessLevelinSiPass
} from 'core/cgi-package';

import { Log } from 'workspace/custom/services/log';
import { IAccessLevel, AccessLevel } from '../../custom/models'
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
    let levelinSiPass = [];

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

    if (data.inputType.reader && data.inputType.reader.length > 0) {
        console.log("bop1");
        for (let idx = 0; idx < data.inputType.reader.length; idx++) {
            let e = data.inputType.reader[idx];

            if (e.get("system") == 1) {
                console.log("bop2");
                let r = {
                    token: "-1",
                    name: e.get("readername") + "-" + data.inputType.timeschedule.get("timename"),
                    timeScheduleToken: data.inputType.timeschedule.get("timeid"),
                    accessRule: [
                        {
                            objectName: e.get("readername"),
                            objectToken: e.get("readerid"),
                            ruleToken: e.get("readerid"),
                            ruleType: 2
                        }
                    ]
                }
                let exists = await new Parse.Query(AccessLevelinSiPass).equalTo("name", r.name).first();
                if(!exists){
                    let r1 = await siPassAdapter.postAccessLevel(r, 10000);
                    console.log("bop3");
                    if (r1["Token"] != undefined) {
                        Log.Info(`${this.constructor.name}`, `postAccessLevel reader ${r1["Token"]} ${r1["Name"]}`);

                        var obj1 = new AccessLevelinSiPass({ token: r1["Token"], name: r1["Name"] });
                        await obj1.save(null, { useMasterKey: true });

                        levelinSiPass.push({ token: r1["Token"], name: r1["Name"] });
                    }
                    else {
                        throw Errors.throw(Errors.CustomNotExists, [`Create Access Level Fail ${r1}`]);
                    }
                }else{
                    levelinSiPass.push({ token: exists.get("token"), name: exists.get("name") });
                }
            }
        }
    }

    if (data.inputType.floor && data.inputType.floor.length > 0) {
        for (let idx = 0; idx < data.inputType.floor.length; idx++) {
            let e = data.inputType.floor[idx];

            if (e.get("system") == 1) {
                let r = {
                    token: "-1",
                    name: e.get("floorname") + "-" + data.inputType.timeschedule.get("timename"),
                    timeScheduleToken: data.inputType.timeschedule.get("timeid"),
                    accessRule: [
                        {
                            objectName: e.get("floorname"),
                            objectToken: e.get("floorid"),
                            ruleToken: e.get("floorid"),
                            ruleType: 8
                        }
                    ]
                }
                let exists = await new Parse.Query(AccessLevelinSiPass).equalTo("name", r.name).first();
                if(!exists){
                    let r1 = await siPassAdapter.postAccessLevel(r, 10000);
                    if (r1["Token"] != undefined) {
                        Log.Info(`${this.constructor.name}`, `postAccessLevel floor ${r1["Token"]} ${r1["Name"]}`);

                        var obj1 = new AccessLevelinSiPass({ token: r1["Token"], name: r1["Name"] });
                        await obj1.save(null, { useMasterKey: true });

                        levelinSiPass.push({ token: r1["Token"], name: r1["Name"] });
                    }
                    else {
                        throw Errors.throw(Errors.CustomNotExists, [`Create Access Level Fail ${r1}`]);
                    }
                }
                else{
                    levelinSiPass.push({ token: exists.get("token"), name: exists.get("name") });
                }

            }
        }
    }

    /// 1) Create Object
    let firstObj = await new Parse.Query(AccessLevel).descending("levelidNumber").first();
    let max = 0;
    if (firstObj && firstObj.get("levelidNumber") >=0){
        console.log("pass", firstObj.get("levelidNumber"));
        max = firstObj.get("levelidNumber") + 1;
    }
        
    console.log("max", max);
    data.inputType.levelid = max + "";
    data.inputType.levelidNumber=max;
    data.inputType.levelname = "name " + data.inputType.levelidNumber;
    data.inputType.levelinSiPass = levelinSiPass ;

    var obj = new AccessLevel(data.inputType);
    await obj.save(null, { useMasterKey: true });

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
 * U: update object
 ********************************/
// type InputU = Restful.InputU<IAccessLevel>;
// type OutputU = Restful.OutputU<IAccessLevel>;

// action.put<InputU, OutputU>({ inputType: "InputU" }, async (data) => {
//     /// 1) Get Object
//     var { objectId } = data.inputType;
//     var obj = await new Parse.Query(AccessLevel).get(objectId);
//     if (!obj) throw Errors.throw(Errors.CustomNotExists, [`AccessLevel <${objectId}> not exists.`]);

//     /// 2) Sync to ACS Services
//     let levelinSiPass = [];
//     if (data.inputType.reader && data.inputType.reader.length > 0) {
//         for (let idx = 0; idx < data.inputType.reader.length; idx++) {
//             let e = data.inputType.reader[idx];

//             let r = {
//                 token: "-1",
//                 name: e.get("readername") + "-" + data.inputType.timeschedule.get("timename"),
//                 timeScheduleToken: data.inputType.timeschedule.get("timeid"),
//                 accessRule: [
//                     {
//                         objectName: e.get("readername"),
//                         objectToken: e.get("readerid"),
//                         ruleToken: e.get("readerid"),
//                         ruleType: 2
//                     }
//                 ]
//             }

//             let r1 = await siPassAdapter.postAccessLevel(r, 10000);
//             if (r1["Token"] != undefined) {
//                 Log.Info(`${this.constructor.name}`, `postAccessLevel reader ${r1["Token"]} ${r1["Name"]}`);

//                 var obj1 = new AccessLevelinSiPass({ token: r1["Token"], name: r1["Name"] });
//                 await obj1.save(null, { useMasterKey: true });

//                 levelinSiPass.push({ token: r1["Token"], name: r1["Name"] });
//             }
//         }
//     }

//     if (data.inputType.floor && data.inputType.floor.length > 0) {
//         for (let idx = 0; idx < data.inputType.floor.length; idx++) {
//             let e = data.inputType.floor[idx];

//             if (e.get("system") == '1') {
//                 let r = {
//                     token: "-1",
//                     name: e.get("floorname") + "-" + data.inputType.timeschedule.get("timename"),
//                     timeScheduleToken: data.inputType.timeschedule.get("timeid"),
//                     accessRule: [
//                         {
//                             objectName: e.get("floorname"),
//                             objectToken: e.get("floorid"),
//                             ruleToken: e.get("floorid"),
//                             ruleType: 8
//                         }
//                     ]
//                 }

//                 let r1 = await siPassAdapter.postAccessLevel(r, 10000);
//                 if (r1["Token"] != undefined) {
//                     Log.Info(`${this.constructor.name}`, `postAccessLevel floor ${r1["Token"]} ${r1["Name"]}`);

//                     var obj1 = new AccessLevelinSiPass({ token: r1["Token"], name: r1["Name"] });
//                     await obj1.save(null, { useMasterKey: true });

//                     levelinSiPass.push({ token: r1["Token"], name: r1["Name"] });
//                 }
//             }
//         }
//     }

//     data.inputType.levelinSiPass = levelinSiPass ;
    
//     /// 3) Modify
//     await obj.save({ ...data.inputType, objectId: undefined });

//     Log.Info(`${this.constructor.name}`, `putAccessLevel ${obj.get("levelid")} ${obj.get("levelname")}`);

        
//     /// 4) Output
//     return ParseObject.toOutputJSON(obj);
// });

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

    Log.Info(`${this.constructor.name}`, `deleteAccessLevel ${obj.get("levelid")} ${obj.get("levelname")}`);

    obj.destroy({ useMasterKey: true });
    /// 3) Output
    return ParseObject.toOutputJSON(obj);
});
/// CRUD end ///////////////////////////////////

export default action;
