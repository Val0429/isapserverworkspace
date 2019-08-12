import { Action, Errors, Restful, ParseObject, Config} from 'core/cgi-package';


import { IMember, Member, PermissionTable } from '../../custom/models'
import { siPassAdapter } from '../../custom/services/acsAdapter-Manager';
import { CCure800SqlAdapter } from '../../custom/services/acs/CCure800SqlAdapter';
import { ReportService } from 'workspace/custom/services/report-service';
import { Log } from 'workspace/custom/services/log';


var action = new Action({
    loginRequired: true,
    postSizeLimit: 1024 * 1024 * 10,
    // permission: [RoleList.Admin, RoleList.SuperAdministrator, RoleList.SystemAdministrator],
    apiToken: "door_member_CRUD"
});

/// CRUD start /////////////////////////////////
/********************************
 * C: create object
 ********************************/
type InputC = Restful.InputC<IMember>;
type OutputC = Restful.OutputC<IMember>;

action.post<InputC, OutputC>({ inputType: "InputC" }, async (data) => {
    /// 1) Check data.inputType
    
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
    let ccureAccessRules:string[] = [];
    for (const rid of obj.get("AccessRules")) {            
        let permission = permissionTables.find(x=>x.get("tableid")== +rid);
        console.log("permission", permission, rid);
        if(!permission)continue;
        if(permission.get("ccurePermissionTable")){
            ccureAccessRules.push(permission.get("ccurePermissionTable")["permissionTableName"]);
        }
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
    let fields = [];
    for(let input of inputs){
        fields.push({FiledName:input.FiledName, FieldValue:input.FieldValue || null})
    } 

    // obj.set("Token", "-1");
    obj.set("CustomFields", fields);
    let ret = ParseObject.toOutputJSON(obj);

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
        
        let cCure800SqlAdapter = new CCure800SqlAdapter();
        // await this.CCure800SqlAdapter.connect(config);
        await cCure800SqlAdapter.writeMember(ret, ccureAccessRules.filter((value, index, self)=>self.indexOf(value)===index), inputs);
        // await this.CCure800SqlAdapter.disconnect();
    }
    catch (ex) {
        console.log(`${this.constructor.name}`, ex);
    }

    Log.Info(`info`, `postMember ${data.inputType.EmployeeNumber} ${data.inputType.FirstName}`, data.user, false);

    /// 2) Output
    return ret;
});

/********************************
 * R: get object
 ********************************/
type InputR = Restful.InputR<any>;
type OutputR = Restful.OutputR<IMember>;

action.get<InputR, OutputR>({ inputType: "InputR" }, async (data) => {
    /// 1) Make Query
    let page = 1;
    let pageSize = 10;
    let paging = data.inputType.paging
    if(paging){
        page = paging.page || 1;
        pageSize = pageSize || 10;

        if(paging.all && paging.all=="true"){
            page=1;
            pageSize=Number.MAX_SAFE_INTEGER;
        }
    }
    
    // 2) Filter data
    let filter = data.parameters;
    filter.ShowEmptyCardNumber="true";
    /// 3) Output
    let reportService = new ReportService();
    let {results, total} = await reportService.getMemberRecord(filter, pageSize, (page-1)*pageSize);
    return {
        paging:{
            page,
            pageSize,
            total,
            totalPages:Math.ceil(total / pageSize)
        },
        results
    };
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
                            .containedIn("tableid", update.get("AccessRules").map(x=>parseInt(x)))
                            .limit(Number.MAX_SAFE_INTEGER).find();

    let ccureAccessRules:string[] = [];
        
    let rules=[];
    for (const rid of update.get("AccessRules").map(x=>+x)) {

        let permission = permissionTables.find(x=>x.get("tableid")== +rid);        

        if(!permission)continue;
        if(permission.get("ccurePermissionTable")){
            ccureAccessRules.push(permission.get("ccurePermissionTable")["permissionTableName"]);
        }
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
    console.log("customFields", inputs);  
    //update the whole custom fields
    let fields = [];
    for(let input of inputs){
        fields.push({FiledName:input.FiledName, FieldValue:input.FieldValue || null})
    }
    update.set("CustomFields", fields);
    
console.log(update);
    
    /// 4) to SiPass
    let ret = ParseObject.toOutputJSON(update);

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

        let cCure800SqlAdapter = new CCure800SqlAdapter();
        
        await cCure800SqlAdapter.connect(config);
        await cCure800SqlAdapter.writeMember(ret,ccureAccessRules.filter((value, index, self)=>self.indexOf(value)===index),inputs);
        await cCure800SqlAdapter.disconnect();
    }
    catch (ex) {
        console.log(`${this.constructor.name}`, ex);
    }
    
    /// 5) to Monogo
    //await obj.save({ ...ret, objectId: undefined });
    await update.save();
    Log.Info(`info`, `putMember ${obj.get("EmployeeNumber")} ${obj.get("FirstName")}`, data.user, false);

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

    Log.Info(`info`, `deleteMember ${obj.get("EmployeeNumber")} ${obj.get("FirstName")}`, data.user, false);

    /// 2) Delete
    obj.destroy({ useMasterKey: true });
    /// 3) Output
    return ParseObject.toOutputJSON(obj);
});
/// CRUD end ///////////////////////////////////

export default action;
