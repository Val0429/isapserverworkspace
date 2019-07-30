import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors, Cameras, ICameras,
    Restful, FileHelper, ParseObject, Config, PermissionTable
} from 'core/cgi-package';

import { Log } from 'helpers/utility';
import { IMember, Member, AccessLevel } from '../../custom/models'
import { siPassAdapter } from '../../custom/services/acsAdapter-Manager';
import { CCure800SqlAdapter } from '../../custom/services/acs/CCure800SqlAdapter';
import { UnbindingRegion } from '../tag';

const defaultFields = [
    { FiledName: "CustomDateControl4__CF" },
    { FiledName: "CustomDropdownControl1__CF" },
    { FiledName: "CustomTextBoxControl1__CF" },
    { FiledName: "CustomTextBoxControl2__CF" },
    { FiledName: "CustomTextBoxControl3__CF" },
    { FiledName: "CustomTextBoxControl6__CF" },
    { FiledName: "CustomDateControl2__CF" },
    { FiledName: "CustomDropdownControl2__CF_CF" },
    { FiledName: "CustomDropdownControl2__CF" },
    { FiledName: "CustomTextBoxControl5__CF_CF" },
    { FiledName: "CustomTextBoxControl5__CF_CF_CF" },
    { FiledName: "CustomTextBoxControl5__CF_CF_CF_CF" },
    { FiledName: "CustomTextBoxControl5__CF_CF_CF_CF_CF" },
    { FiledName: "CustomTextBoxControl5__CF_CF_CF_CF_CF_CF" },
    { FiledName: "CustomTextBoxControl5__CF_CF_CF_CF_CF_CF_CF" },
    { FiledName: "CustomTextBoxControl5__CF_CF_CF_CF_CF_CF_CF_CF" },
    { FiledName: "CustomTextBoxControl5__CF_CF_CF_CF_CF_CF_CF_CF_CF" },
    { FiledName: "CustomTextBoxControl5__CF_CF_CF_CF_CF_CF_CF_CF_CF_CF" },
    { FiledName: "CustomTextBoxControl5__CF_CF_CF_CF_CF_CF_CF_CF_CF_CF_CF" },
    { FiledName: "CustomTextBoxControl5__CF" },
    { FiledName: "CustomDateControl1__CF_CF" },
    { FiledName: "CustomDateControl1__CF_CF_CF" },
    { FiledName: "CustomDateControl1__CF" },
    { FiledName: "CustomDropdownControl3__CF_CF" },
    { FiledName: "CustomDropdownControl3__CF_CF_CF" },
    { FiledName: "CustomDropdownControl3__CF_CF_CF_CF" },
    { FiledName: "CustomDropdownControl3__CF_CF_CF_CF_CF" },
    { FiledName: "CustomDropdownControl3__CF_CF_CF_CF_CF_CF" },
    { FiledName: "CustomDropdownControl3__CF" },
    { FiledName: "CustomTextBoxControl7__CF_CF" },
    { FiledName: "CustomTextBoxControl7__CF_CF_CF" },
    { FiledName: "CustomTextBoxControl7__CF_CF_CF_CF" },
    { FiledName: "CustomTextBoxControl7__CF_CF_CF_CF_CF" },
    { FiledName: "CustomTextBoxControl7__CF_CF_CF_CF_CF_CF" },
    { FiledName: "CustomTextBoxControl7__CF_CF_CF_CF_CF_CF_CF" },
    { FiledName: "CustomTextBoxControl7__CF_CF_CF_CF_CF_CF_CF_CF" },
    { FiledName: "CustomTextBoxControl7__CF_CF_CF_CF_CF_CF_CF_CF_CF" },
    { FiledName: "CustomTextBoxControl7__CF_CF_CF_CF_CF_CF_CF_CF_CF_CF" },
    { FiledName: "CustomTextBoxControl7__CF_CF_CF_CF_CF_CF_CF_CF_CF_CF_CF" },
    { FiledName: "CustomTextBoxControl7__CF_CF_CF_CF_CF_CF_CF_CF_CF_CF_CF_CF" },
    { FiledName: "CustomTextBoxControl7__CF" },
    { FiledName: "CustomDateControl3__CF_CF" },
    { FiledName: "CustomDateControl3__CF_CF_CF" },
    { FiledName: "CustomDateControl3__CF_CF_CF_CF" },
    { FiledName: "CustomDateControl3__CF_CF_CF_CF_CF" },
    { FiledName: "CustomDateControl3__CF_CF_CF_CF_CF_CF" },
    { FiledName: "CustomDateControl3__CF_CF_CF_CF_CF_CF_CF" },
    { FiledName: "CustomDateControl3__CF_CF_CF_CF_CF_CF_CF_CF" },
    { FiledName: "CustomDateControl3__CF_CF_CF_CF_CF_CF_CF_CF_CF" },
    { FiledName: "CustomDateControl3__CF_CF_CF_CF_CF_CF_CF_CF_CF_CF" },
    { FiledName: "CustomDateControl3__CF_CF_CF_CF_CF_CF_CF_CF_CF_CF_CF" },
    { FiledName: "CustomDateControl3__CF_CF_CF_CF_CF_CF_CF_CF_CF_CF_CF_CF" },
    { FiledName: "CustomDateControl3__CF" }
];
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
    /// 1) Check data.inputType
    // if ( (siPassAdapter.sessionToken == undefined) || (siPassAdapter.sessionToken == "") ) {
    //     Log.Info(`CGI acsSync`, `SiPass Connect fail. Please contact system administrator!`);
    //     throw Errors.throw(Errors.CustomNotExists, [`SiPass Connect fail. Please contact system administrator!`]);
    // }
    let emp = await new Parse.Query(Member).equalTo("EmployeeNumber", data.inputType.EmployeeNumber).first();
    if (emp){
        throw Errors.throw(Errors.CustomNotExists, [`EmployeeNumber is duplicate.`]);
    }
    if (data.inputType.Credentials[0]) {
        let cardno = data.inputType.Credentials[0].CardNumber;;

        if (cardno != "") {
            let cnt = await new Parse.Query(Member).equalTo("Credentials.CardNumber", cardno).first();
            if (cnt != null) {
                throw Errors.throw(Errors.CustomNotExists, [`Credentials.CardNumber is duplicate.`]);
            }

            let hStart = data.inputType.StartDate;
            let hEnd = data.inputType.EndDate;
            let cStart = data.inputType.Credentials[0].StartDate;
            let cEnd = data.inputType.Credentials[0].EndDate;

            if (cEnd <= cStart)
                throw Errors.throw(Errors.CustomNotExists, [`Credential Start and End Date should be within the Cardholder Start and End Date`]);

            if (hStart > cStart)
                throw Errors.throw(Errors.CustomNotExists, [`Credential Start and End Date should be within the Cardholder Start and End Date`]);

            if (hEnd < cStart)
                throw Errors.throw(Errors.CustomNotExists, [`Credential Start and End Date should be within the Cardholder Start and End Date`]);
        }
    }

    /// 2) Create Object
    var obj = new Member(data.inputType);

    // AccessRules
    let permissionTables = await new Parse.Query(PermissionTable)
        .containedIn("tableid", obj.get("AccessRules").map(x=>parseInt(x)))
        .limit(Number.MAX_SAFE_INTEGER).find();

    let rules=[];
    for (const rid of obj.get("AccessRules")) {            
        let permission = permissionTables.find(x=>x.get("tableid")== +rid);
        console.log("permission", permission, rid);
        if(!permission)continue;
        let newRule = {
            ObjectName: permission.get("tablename"),
            ObjectToken:  permission.get("tableid").toString(),
            RuleToken: permission.get("tableid").toString(),
            RuleType: 4,
            Side: 0,
            TimeScheduleToken: "0"
        };
        rules.push(newRule);
    }
    obj.set("AccessRules", rules);
    // if (rules.length <= 0 ) {
    //     throw Errors.throw(Errors.CustomNotExists, [`Create Card Holder Fail. Access Level is Empty.`]);
    // }

    // CustomFields
    let inputs = obj.get("CustomFields");
    let fields = Object.assign([], defaultFields);
    for(let field of fields){        
        let cf = inputs.find(x=>x.FiledName==field.FiledName);
        if(!cf)continue;
        field.FieldValue = cf.FieldValue && cf.FieldValue !="" ?cf.FieldValue :null;
    }   

    // obj.set("Token", "-1");
    obj.set("CustomFields", fields);
    // obj.set("Vehicle1", {});
    // obj.set("Vehicle2", {});
    // obj.set("VisitorDetails", {
    //     "VisitorCardStatus": 0,
    //     "VisitorCustomValues": {}
    // });
    
    let ret = ParseObject.toOutputJSON(obj);
    ret.CustomFields = Object.assign([], fields);

    let holder = await siPassAdapter.postCardHolder(ret);
    if (holder["Token"] == undefined ) {
        throw Errors.throw(Errors.CustomNotExists, [`Create Card Holder Fail ${holder}`]);
    }

    obj.set("Token", holder["Token"]);
    await obj.save(null, { useMasterKey: true });


    try {
        // let config = {
        //     server: Config.ccuresqlserver.server,
        //     port: Config.ccuresqlserver.port,
        //     user: Config.ccuresqlserver.user,
        //     password: Config.ccuresqlserver.password,
        //     database: Config.ccuresqlserver.database,
        //     requestTimeout: 50000,
        //     connectionTimeout: 50000 //ms
        // }

        this.CCure800SqlAdapter = new CCure800SqlAdapter();
        // await this.CCure800SqlAdapter.connect(config);
        await this.CCure800SqlAdapter.writeMember(ret);
        // await this.CCure800SqlAdapter.disconnect();
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
    var { objectId } = data.inputType;

    if (objectId) {
        query.matches("id", new RegExp(objectId), "i");
    }

    let filter = data.parameters;
    // looking for duplication
    if (filter.eEmployeeNumber) query.equalTo("EmployeeNumber",  filter.eEmployeeNumber);
    if (filter.eCardNumber) query.equalTo("Credentials.CardNumber", filter.eCardNumber);

    //"like" query
    if (filter.LastName) query.matches("LastName", new RegExp(filter.LastName), "i");
    if (filter.FirstName) query.matches("FirstName", new RegExp(filter.FirstName), "i");
    if (filter.EmployeeNumber) query.matches("EmployeeNumber", new RegExp(filter.EmployeeNumber), "i");
    if (filter.CardNumber) query.matches("Credentials.CardNumber", new RegExp(filter.CardNumber), "i");
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
    let update = new Member(data.inputType);

    /// 3) Check data.inputType    
    // if (siPassAdapter.sessionToken == "")
    //     throw Errors.throw(Errors.CustomNotExists, [`SiPass Connect fail. Please contact system administrator!`]);

    if (data.inputType.Credentials[0]) {
        let cardno = data.inputType.Credentials[0].CardNumber;;

        if (cardno != "") {
            let cnt = await new Parse.Query(Member).equalTo("Credentials.CardNumber", cardno).notEqualTo("objectId", objectId).first();
            if (cnt != null) {
                throw Errors.throw(Errors.CustomNotExists, [`Credentials.CardNumber is duplicate.`]);
            }

            let hStart = data.inputType.StartDate;
            let hEnd = data.inputType.EndDate;
            let cStart = data.inputType.Credentials[0].StartDate;
            let cEnd = data.inputType.Credentials[0].EndDate;

            if (cEnd <= cStart)
                throw Errors.throw(Errors.CustomNotExists, [`Credential Start and End Date should be within the Cardholder Start and End Date`]);

            if (hStart > cStart)
                throw Errors.throw(Errors.CustomNotExists, [`Credential Start and End Date should be within the Cardholder Start and End Date`]);

            if (hEnd < cStart)
                throw Errors.throw(Errors.CustomNotExists, [`Credential Start and End Date should be within the Cardholder Start and End Date`]);
        }
    }


    // AccessRules
    let permissionTables = await new Parse.Query(PermissionTable)
        .limit(Number.MAX_SAFE_INTEGER).find();

    let rules=[];
    for (const rid of update.get("AccessRules").map(x=>+x)) {

        let permission = permissionTables.find(x=>x.get("tableid")== +rid);        

        if(!permission)continue;
        let newRule = {
                ObjectName: permission.get("tablename"),
                ObjectToken: permission.get("tableid").toString(),
                RuleToken: permission.get("tableid").toString(),
                RuleType: 4,
                Side: 0,
                TimeScheduleToken: "0"
        };
        rules.push(newRule);
    }
    update.set("AccessRules", rules);
    // if (rules.length <= 0 ) {
    //     throw Errors.throw(Errors.CustomNotExists, [`Create Card Holder Fail. Access Level is Empty.`]);
    // }


	update.set("Vehicle1", { CarColor:"", CarModelNumber:"", CarRegistrationNumber: ""} );
	update.set("Vehicle2", { CarColor:"", CarModelNumber:"", CarRegistrationNumber: ""} );
	
	update.set("GeneralInformation", obj.get("GeneralInformation"));
	update.set("Status", obj.get("Status"));
	update.set("Token", obj.get("Token"));
	update.set("token", obj.get("Token"));
    update.set("GeneralInformation", obj.get("GeneralInformation"));
    // CustomFields
    let inputs = update.get("CustomFields");    
    
    //only update existing fields
    // let fields = obj.get("CustomFields");
    // if (!fields) fields = Object.assign([], defaultFields);    

    //update the whole custom fields
    let fields = Object.assign([], defaultFields); 

    for(let field of fields){
        let cf = inputs.find(x=>x.FiledName==field.FiledName);
        if(!cf)continue;
        field.FieldValue = cf.FieldValue && cf.FieldValue !="" ?cf.FieldValue : null;
    }
    update.set("CustomFields", fields);
    
console.log(update);
    
    /// 4) to SiPass
    let ret = ParseObject.toOutputJSON(update);
    ret.CustomFields = Object.assign([], fields);

    let holder = await siPassAdapter.putCardHolder(ret);
    if (holder["Token"] == undefined ) {
        throw Errors.throw(Errors.CustomNotExists, [`Create Card Holder Fail ${holder}`]);
    }

	ret["Token"] = ret["Token"] + "" ;
	delete ret["token"] ;
	
    try {
        let config = {
            server: Config.ccuresqlserver.server,
            port: Config.ccuresqlserver.port,
            user: Config.ccuresqlserver.user,
            password: Config.ccuresqlserver.password,
            database: Config.ccuresqlserver.database,
            requestTimeout: 50000,
            connectionTimeout: 50000 //ms
        }

        this.CCure800SqlAdapter = new CCure800SqlAdapter();
        
        await this.CCure800SqlAdapter.connect(config);
        await this.CCure800SqlAdapter.writeMember(ret);
        await this.CCure800SqlAdapter.disconnect();
    }
    catch (ex) {
        console.log(`${this.constructor.name}`, ex);
    }
    
    /// 5) to Monogo
    //await obj.save({ ...ret, objectId: undefined });
    await update.save();
    Log.Info(`${this.constructor.name}`, `putMember ${obj.get("EmployeeNumber")} ${obj.get("FirstName")}`);

    /// 3) Output
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
