import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors, Cameras, ICameras,
    Restful, FileHelper, ParseObject, Config
} from 'core/cgi-package';

import { Log } from 'helpers/utility';
import { IMember, Member, AccessLevel } from '../../custom/models'
import { siPassAdapter } from '../../custom/services/acsAdapter-Manager';
import { CCure800SqlAdapter } from '../../custom/services/acs/CCure800SqlAdapter';


var action = new Action({
    loginRequired: false,
    postSizeLimit: 1024 * 1024 * 10,
    // permission: [RoleList.Admin, RoleList.SuperAdministrator, RoleList.SystemAdministrator],
    apiToken: "3-2_door_member_CRUD"
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

    let cardno = "";
    try {
        cardno = obj.get("Credentials")[0]["CardNumber"];
    }
    catch (e) {
        throw Errors.throw(Errors.CustomNotExists, [`Credentials.CardNumber is empty.`]);
    }

    let cnt = await new Parse.Query(Member).equalTo("Credentials.CardNumber", cardno).first();
    if (cnt != null) {
        throw Errors.throw(Errors.CustomNotExists, [`Credentials.CardNumber is duplicate.`]);
    }

    // AccessRules
    let accessLevels = await new Parse.Query(AccessLevel).find();

    let rules = obj.get("AccessRules");
    if (rules) {
        for (let i = 0; i < rules.length; i++) {
            const rid = rules[i];

            for (let j = 0; j < accessLevels.length; j++) {
                const level = accessLevels[j];

                if (level.get("levelid") == rid)
                    rules.splice(i, 1, level);
            }
        }
    }

    // CustomFields
    let fields = [
        { "FiledName": "CustomDateControl4__CF" },
        { "FiledName": "CustomDropdownControl1__CF" },
        { "FiledName": "CustomTextBoxControl1__CF" },
        { "FiledName": "CustomTextBoxControl2__CF" },
        { "FiledName": "CustomTextBoxControl3__CF" },
        { "FiledName": "CustomTextBoxControl6__CF" },
        { "FiledName": "CustomDateControl2__CF" },
        { "FiledName": "CustomDropdownControl2__CF_CF" },
        { "FiledName": "CustomDropdownControl2__CF" },
        { "FiledName": "CustomTextBoxControl5__CF_CF" },
        { "FiledName": "CustomTextBoxControl5__CF_CF_CF" },
        { "FiledName": "CustomTextBoxControl5__CF_CF_CF_CF" },
        { "FiledName": "CustomTextBoxControl5__CF_CF_CF_CF_CF" },
        { "FiledName": "CustomTextBoxControl5__CF_CF_CF_CF_CF_CF" },
        { "FiledName": "CustomTextBoxControl5__CF_CF_CF_CF_CF_CF_CF" },
        { "FiledName": "CustomTextBoxControl5__CF_CF_CF_CF_CF_CF_CF_CF" },
        { "FiledName": "CustomTextBoxControl5__CF_CF_CF_CF_CF_CF_CF_CF_CF" },
        { "FiledName": "CustomTextBoxControl5__CF_CF_CF_CF_CF_CF_CF_CF_CF_CF" },
        { "FiledName": "CustomTextBoxControl5__CF_CF_CF_CF_CF_CF_CF_CF_CF_CF_CF" },
        { "FiledName": "CustomTextBoxControl5__CF" },
        { "FiledName": "CustomDateControl1__CF_CF" },
        { "FiledName": "CustomDateControl1__CF_CF_CF" },
        { "FiledName": "CustomDateControl1__CF" },
        { "FiledName": "CustomDropdownControl3__CF_CF" },
        { "FiledName": "CustomDropdownControl3__CF_CF_CF" },
        { "FiledName": "CustomDropdownControl3__CF_CF_CF_CF" },
        { "FiledName": "CustomDropdownControl3__CF_CF_CF_CF_CF" },
        { "FiledName": "CustomDropdownControl3__CF_CF_CF_CF_CF_CF" },
        { "FiledName": "CustomDropdownControl3__CF" },
        { "FiledName": "CustomTextBoxControl7__CF_CF" },
        { "FiledName": "CustomTextBoxControl7__CF_CF_CF" },
        { "FiledName": "CustomTextBoxControl7__CF_CF_CF_CF" },
        { "FiledName": "CustomTextBoxControl7__CF_CF_CF_CF_CF" },
        { "FiledName": "CustomTextBoxControl7__CF_CF_CF_CF_CF_CF" },
        { "FiledName": "CustomTextBoxControl7__CF_CF_CF_CF_CF_CF_CF" },
        { "FiledName": "CustomTextBoxControl7__CF_CF_CF_CF_CF_CF_CF_CF" },
        { "FiledName": "CustomTextBoxControl7__CF_CF_CF_CF_CF_CF_CF_CF_CF" },
        { "FiledName": "CustomTextBoxControl7__CF_CF_CF_CF_CF_CF_CF_CF_CF_CF" },
        { "FiledName": "CustomTextBoxControl7__CF_CF_CF_CF_CF_CF_CF_CF_CF_CF_CF" },
        { "FiledName": "CustomTextBoxControl7__CF_CF_CF_CF_CF_CF_CF_CF_CF_CF_CF_CF" },
        { "FiledName": "CustomTextBoxControl7__CF" },
        { "FiledName": "CustomDateControl3__CF_CF" },
        { "FiledName": "CustomDateControl3__CF_CF_CF" },
        { "FiledName": "CustomDateControl3__CF_CF_CF_CF" },
        { "FiledName": "CustomDateControl3__CF_CF_CF_CF_CF" },
        { "FiledName": "CustomDateControl3__CF_CF_CF_CF_CF_CF" },
        { "FiledName": "CustomDateControl3__CF_CF_CF_CF_CF_CF_CF" },
        { "FiledName": "CustomDateControl3__CF_CF_CF_CF_CF_CF_CF_CF" },
        { "FiledName": "CustomDateControl3__CF_CF_CF_CF_CF_CF_CF_CF_CF" },
        { "FiledName": "CustomDateControl3__CF_CF_CF_CF_CF_CF_CF_CF_CF_CF" },
        { "FiledName": "CustomDateControl3__CF_CF_CF_CF_CF_CF_CF_CF_CF_CF_CF" },
        { "FiledName": "CustomDateControl3__CF_CF_CF_CF_CF_CF_CF_CF_CF_CF_CF_CF" },
        { "FiledName": "CustomDateControl3__CF" }
    ];
    let inputs = obj.get("CustomFields");

    if (inputs) {
        for (let i = 0; i < fields.length; i++) {
            const db = fields[i];

            for (let j = 0; j < inputs.length; j++) {
                const input = inputs[j];

                if (input["FiledName"] == db["FiledName"])
                    db["FieldValue"] = input["FieldValue"];
            }
        }
    }

    obj.set("Token", "-1");
    obj.set("CustomFields", fields);
    obj.set("Vehicle1", {});
    obj.set("Vehicle2", {});
    obj.set("VisitorDetails", {
        "VisitorCardStatus": 0,
        "VisitorCustomValues": {}
    });

    await obj.save(null, { useMasterKey: true });

    let ret = ParseObject.toOutputJSON(obj);
    console.log(ret);

    let holder = await siPassAdapter.postCardHolder(ret);
    console.log(holder);

    try {
        let config = {
            server: Config.ccuresqlserver.server,
            port: Config.ccuresqlserver.port,
            user: Config.ccuresqlserver.user,
            password: Config.ccuresqlserver.password,
            database: Config.ccuresqlserver.database,
            requestTimeout: 300000,
            connectionTimeout: 300000 //ms
        }

        await this.CCure800SqlAdapter.connect(config);
        await this.CCure800SqlAdapter.writeMember(ret);
        await this.CCure800SqlAdapter.disconnect();
    }
    catch (ex) {
        console.log(`${this.constructor.name}`, ex);
    }

    Log.Info(`${this.constructor.name}`, `postMember ${data.inputType.EmployeeNumber} ${data.inputType.FirstName}`);

    /// 2) Output
    return ret;
});

/********************************
 * R: get object
 ********************************/
type InputR = Restful.InputR<any>;
type OutputR = Restful.OutputR<IMember>;

const fieldNames = {
    DepartmentName: "CustomTextBoxControl5__CF_CF_CF",
    CostCenterName: "CustomTextBoxControl5__CF_CF_CF_CF",
    WorkAreaName: "CustomTextBoxControl5__CF_CF_CF_CF_CF_CF",
    CardType: "CustomDropdownControl1__CF"
}

action.get<InputR, OutputR>({ inputType: "InputR" }, async (data) => {
    /// 1) Make Query
    var query = new Parse.Query(Member);

    let filter = data.parameters;
    if (filter.LastName) query.matches("LastName", new RegExp(filter.LastName), "i");
    if (filter.FirstName) query.matches("FirstName", new RegExp(filter.FirstName), "i");
    if (filter.EmployeeNumber) query.matches("EmployeeNumber", new RegExp(filter.EmployeeNumber), "i");
    if (filter.CardNumber) query.equalTo("Credentials.CardNumber", filter.CardNumber);
    if (filter.DepartmentName) query.equalTo("CustomFields.FiledName", fieldNames.DepartmentName).matches("CustomFields.FieldValue", new RegExp(filter.DepartmentName), "i");
    if (filter.CostCenterName) query.equalTo("CustomFields.FiledName", fieldNames.CostCenterName).matches("CustomFields.FieldValue", new RegExp(filter.CostCenterName), "i");
    if (filter.WorkAreaName) query.equalTo("CustomFields.FiledName", fieldNames.WorkAreaName).matches("CustomFields.FieldValue", new RegExp(filter.WorkAreaName), "i");

    if (filter.CardType) query.equalTo("CustomFields.FiledName", fieldNames.CardType).matches("CustomFields.FieldValue", new RegExp(filter.CardType), "i");

    if (filter.start2 && filter.end2) {
        query.lessThanOrEqualTo("EndDate", filter.end2).greaterThanOrEqualTo("EndDate", filter.start2);
    }
    if (filter.start1 && filter.end1) {
        query.lessThanOrEqualTo("StartDate", filter.end1).greaterThanOrEqualTo("StartDate", filter.start1);
    }
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

    if (rules) {
        for (let i = 0; i < rules.length; i++) {
            const rid = rules[i];

            for (let j = 0; j < accessLevels.length; j++) {
                const level = accessLevels[j];

                if (level.get("levelid") == rid)
                    rules.splice(i, 1, level);
            }
        }
    }


    // CustomFields
    if (obj) {
        let fields = obj.get("CustomFields");
        let inputs = update.get("CustomFields");

        if (fields == undefined) {
            // CustomFields
            fields = [
                { "FiledName": "CustomDateControl4__CF" },
                { "FiledName": "CustomDropdownControl1__CF" },
                { "FiledName": "CustomTextBoxControl1__CF" },
                { "FiledName": "CustomTextBoxControl2__CF" },
                { "FiledName": "CustomTextBoxControl3__CF" },
                { "FiledName": "CustomTextBoxControl6__CF" },
                { "FiledName": "CustomDateControl2__CF" },
                { "FiledName": "CustomDropdownControl2__CF_CF" },
                { "FiledName": "CustomDropdownControl2__CF" },
                { "FiledName": "CustomTextBoxControl5__CF_CF" },
                { "FiledName": "CustomTextBoxControl5__CF_CF_CF" },
                { "FiledName": "CustomTextBoxControl5__CF_CF_CF_CF" },
                { "FiledName": "CustomTextBoxControl5__CF_CF_CF_CF_CF" },
                { "FiledName": "CustomTextBoxControl5__CF_CF_CF_CF_CF_CF" },
                { "FiledName": "CustomTextBoxControl5__CF_CF_CF_CF_CF_CF_CF" },
                { "FiledName": "CustomTextBoxControl5__CF_CF_CF_CF_CF_CF_CF_CF" },
                { "FiledName": "CustomTextBoxControl5__CF_CF_CF_CF_CF_CF_CF_CF_CF" },
                { "FiledName": "CustomTextBoxControl5__CF_CF_CF_CF_CF_CF_CF_CF_CF_CF" },
                { "FiledName": "CustomTextBoxControl5__CF_CF_CF_CF_CF_CF_CF_CF_CF_CF_CF" },
                { "FiledName": "CustomTextBoxControl5__CF" },
                { "FiledName": "CustomDateControl1__CF_CF" },
                { "FiledName": "CustomDateControl1__CF_CF_CF" },
                { "FiledName": "CustomDateControl1__CF" },
                { "FiledName": "CustomDropdownControl3__CF_CF" },
                { "FiledName": "CustomDropdownControl3__CF_CF_CF" },
                { "FiledName": "CustomDropdownControl3__CF_CF_CF_CF" },
                { "FiledName": "CustomDropdownControl3__CF_CF_CF_CF_CF" },
                { "FiledName": "CustomDropdownControl3__CF_CF_CF_CF_CF_CF" },
                { "FiledName": "CustomDropdownControl3__CF" },
                { "FiledName": "CustomTextBoxControl7__CF_CF" },
                { "FiledName": "CustomTextBoxControl7__CF_CF_CF" },
                { "FiledName": "CustomTextBoxControl7__CF_CF_CF_CF" },
                { "FiledName": "CustomTextBoxControl7__CF_CF_CF_CF_CF" },
                { "FiledName": "CustomTextBoxControl7__CF_CF_CF_CF_CF_CF" },
                { "FiledName": "CustomTextBoxControl7__CF_CF_CF_CF_CF_CF_CF" },
                { "FiledName": "CustomTextBoxControl7__CF_CF_CF_CF_CF_CF_CF_CF" },
                { "FiledName": "CustomTextBoxControl7__CF_CF_CF_CF_CF_CF_CF_CF_CF" },
                { "FiledName": "CustomTextBoxControl7__CF_CF_CF_CF_CF_CF_CF_CF_CF_CF" },
                { "FiledName": "CustomTextBoxControl7__CF_CF_CF_CF_CF_CF_CF_CF_CF_CF_CF" },
                { "FiledName": "CustomTextBoxControl7__CF_CF_CF_CF_CF_CF_CF_CF_CF_CF_CF_CF" },
                { "FiledName": "CustomTextBoxControl7__CF" },
                { "FiledName": "CustomDateControl3__CF_CF" },
                { "FiledName": "CustomDateControl3__CF_CF_CF" },
                { "FiledName": "CustomDateControl3__CF_CF_CF_CF" },
                { "FiledName": "CustomDateControl3__CF_CF_CF_CF_CF" },
                { "FiledName": "CustomDateControl3__CF_CF_CF_CF_CF_CF" },
                { "FiledName": "CustomDateControl3__CF_CF_CF_CF_CF_CF_CF" },
                { "FiledName": "CustomDateControl3__CF_CF_CF_CF_CF_CF_CF_CF" },
                { "FiledName": "CustomDateControl3__CF_CF_CF_CF_CF_CF_CF_CF_CF" },
                { "FiledName": "CustomDateControl3__CF_CF_CF_CF_CF_CF_CF_CF_CF_CF" },
                { "FiledName": "CustomDateControl3__CF_CF_CF_CF_CF_CF_CF_CF_CF_CF_CF" },
                { "FiledName": "CustomDateControl3__CF_CF_CF_CF_CF_CF_CF_CF_CF_CF_CF_CF" },
                { "FiledName": "CustomDateControl3__CF" }
            ];
        }

        if (inputs != undefined) {
            for (let i = 0; i < fields.length; i++) {
                const db = fields[i];

                for (let j = 0; j < inputs.length; j++) {
                    const input = inputs[j];

                    if (input["FiledName"] == db["FiledName"]) {
                        db["FieldValue"] = input["FieldValue"];
                        break;
                    }
                }
            }
        }
        update.set("CustomFields", fields);
    }

    // update.set("Vehicle1", {});
    // update.set("Vehicle2", {});
    // update.set("VisitorDetails", {
    //     "VisitorCardStatus": 0,
    //     "VisitorCustomValues": {}
    // });

    await obj.save({ ...ParseObject.toOutputJSON(update), objectId: undefined });

    Log.Info(`${this.constructor.name}`, `putMember ${obj.get("EmployeeNumber")} ${obj.get("FirstName")}`);

    /// 3) Output
    let ret = ParseObject.toOutputJSON(obj);
    console.log(ret);

    let holder = await siPassAdapter.postCardHolder(ret);
    console.log(holder);

    return ret;
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

    Log.Info(`${this.constructor.name}`, `deleteMember ${obj.get("EmployeeNumber")} ${obj.get("FirstName")}`);

    /// 2) Delete
    obj.destroy({ useMasterKey: true });
    /// 3) Output
    return ParseObject.toOutputJSON(obj);
});
/// CRUD end ///////////////////////////////////

export default action;
