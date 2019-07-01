import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors, Cameras, ICameras,
    Restful, FileHelper, ParseObject
} from 'core/cgi-package';

import { IMember, Member, AccessLevel } from '../../custom/models'


var action = new Action({
    loginRequired: false,
    postSizeLimit: 1024*1024*10,
    permission: [RoleList.Admin, RoleList.SuperAdministrator, RoleList.SystemAdministrator]
});

/// CRUD start /////////////////////////////////
/********************************
 * C: create object
 ********************************/
type InputC = Restful.InputC<IMember>;
type OutputC = Restful.OutputC<IMember>;

action.post<InputC, OutputC>({ inputType: "InputC" }, async (data) => {
    /// 1) Create Object
    var obj = new Member(data.inputType);

    // AccessRules
    let accessLevels = await new Parse.Query(AccessLevel).find();


    let rules = obj.get("AccessRules");
    for (let i = 0; i < rules.length; i++) {
        const rid = rules[i];

        for (let j = 0; j < accessLevels.length; j++) {
            const level = accessLevels[j];
            
            if ( level.get("levelid")== rid)
                rules.splice(i, 1, level);
        }
    }

    // CustomFields
    let record = await new Parse.Query(Member).equalTo("EmployeeNumber", data.inputType.EmployeeNumber).first();
    let fields = record.get("CustomFields");

    let inputs = obj.get("CustomFields");

    for (let i = 0; i < fields.length; i++) {
        const db = fields[i];

        for (let j = 0; j < inputs.length; j++) {
            const input = inputs[j];
            
            if ( input.get("FiledName") == db.get("FiledName"))
                db.set("FieldValue", input.get("FieldValue"));
        }

    }

    obj.set("CustomFields", fields);

    await obj.save(null, { useMasterKey: true });
    /// 2) Output
    return ParseObject.toOutputJSON(obj);
});

/********************************
 * R: get object
 ********************************/
type InputR = Restful.InputR<IMember>;
type OutputR = Restful.OutputR<IMember>;

action.get<InputR, OutputR>({ inputType: "InputR" }, async (data) => {
    /// 1) Make Query
    var query = new Parse.Query(Member);
    /// 2) With Extra Filters
    query = Restful.Filter(query, data.inputType);
    /// 3) Output
    return Restful.Pagination(query, data.parameters);
});

/********************************
 * U: update object
 ********************************/
type InputU = Restful.InputU<IMember>;
type OutputU = Restful.OutputU<IMember>;

action.put<InputU, OutputU>({ inputType: "InputU" }, async (data) => {
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query(Member).get(objectId);
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [`Member <${objectId}> not exists.`]);
    /// 2) Modify

    // AccessRules
    let accessLevels = await new Parse.Query(AccessLevel).find();
    let update = new Member(data.inputType);

    let rules = update.get("AccessRules");

    for (let i = 0; i < rules.length; i++) {
        const rid = rules[i];

        for (let j = 0; j < accessLevels.length; j++) {
            const level = accessLevels[j];

            if ( level.get("levelid")== rid)
                rules.splice(i, 1, level);
        }
    }

    // CustomFields
    let record = await new Parse.Query(Member).equalTo("EmployeeNumber", data.inputType.EmployeeNumber).first();

    let fields = record.get("CustomFields");
    let inputs = update.get("CustomFields");

    for (let i = 0; i < fields.length; i++) {
        const db = fields[i];

        for (let j = 0; j < inputs.length; j++) {
            const input = inputs[j];

            if ( input["FiledName"] == db["FiledName"]) {
                db["FieldValue"] = input["FieldValue"];
                break ;
            }
        }
    }

    update.set("CustomFields", fields);

    // console.log( ParseObject.toOutputJSON(update));

    await obj.save({ ...ParseObject.toOutputJSON(update), objectId: undefined });

    /// 3) Output
    return ParseObject.toOutputJSON(obj);
});

/********************************
 * D: delete object
 ********************************/
type InputD = Restful.InputD<IMember>;
type OutputD = Restful.OutputD<IMember>;

action.delete<InputD, OutputD>({ inputType: "InputD" }, async (data) => {
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query(Member).get(objectId);
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [`Member <${objectId}> not exists.`]);
    /// 2) Delete
    obj.destroy({ useMasterKey: true });
    /// 3) Output
    return ParseObject.toOutputJSON(obj);
});
/// CRUD end ///////////////////////////////////

export default action;
