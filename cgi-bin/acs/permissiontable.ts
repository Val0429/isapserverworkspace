import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors, Cameras, ICameras,
    Restful, FileHelper, ParseObject
} from 'core/cgi-package';

import { IPermissionTable, PermissionTable } from '../../custom/models'

// import { SiPassAdapter } from '../../custom/services/acs/SiPass'
import { Log } from 'helpers/utility';
import * as delay from 'delay';

var action = new Action({
    loginRequired: false,
    permission: [RoleList.Admin]
});

/// CRUD start /////////////////////////////////
/********************************
 * C: create object
 ********************************/
type InputC = Restful.InputC<IPermissionTable>;
type OutputC = Restful.OutputC<IPermissionTable>;

action.post<InputC, OutputC>({ inputType: "InputC" }, async (data) => {
    /// 1) Create Object
    var obj = new PermissionTable(data.inputType);
    await obj.save(null, { useMasterKey: true });

    // this.adSiPass = new SiPassAdapter();

    // // 1.0 Initial Adapter Login
    // {
    //     Log.Info(`${this.constructor.name}`, `1.0 Initial Adapter Login`);
    //     let sessionId = await this.adSiPass.Login();
    // }
    // await delay(1000);
   
    // 2.0 Access Group
    // {
    //     Log.Info(`${this.constructor.name}`, `2.0 Access Group`);

    //     let al = [] ;
    //     for (let i = 0; i < data.inputType.accesslevels.length; i++) {
    //         let level = ParseObject.toOutputJSON(data.inputType.accesslevels[i]);
            
    //         let ar = [] ;
    //         for (let j = 0; j < level["readers"].length; j++) {
    //             const r = level["readers"][j];
                
    //             ar.push( {ObjectToken: r["readerid"], ObjectName:r["readername"], RuleToken: 12, RuleType:2} );
    //         }
            
    //         al.push({
    //             name: level["levelid"],
    //             token: level["levelname"],
    //             accessRule: ar,
    //             timeScheduleToken: level["timeschedule"]["timeid"]
    //         });
    //     }

    //     let ag = {
    //         name: data.inputType.tableid,
    //         token: data.inputType.tablename,
    //         accessLevels: al
    //     };

    //     await this.adSiPass.postAccessGroup(ag);
    // }

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
    var query = new Parse.Query(PermissionTable);
        //.include("timeschedule")
        //.include("member");
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
