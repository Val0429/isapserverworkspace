import { Action, Errors, Restful, ParseObject} from 'core/cgi-package';


import { IMember, Member, PermissionTable, ILinearMember, LinearMember } from '../../custom/models'
import { siPassAdapter } from '../../custom/services/acsAdapter-Manager';
import { CCure800SqlAdapter } from '../../custom/services/acs/CCure800SqlAdapter';
import { ReportService } from 'workspace/custom/services/report-service';
import { Log } from 'workspace/custom/services/log';
import MemberService, { memberFields } from 'workspace/custom/services/member-service';
import { ICardholderObject } from 'workspace/custom/modules/acs/sipass';
import moment = require('moment');


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
type InputC = Restful.InputC<ILinearMember>;
type OutputC = Restful.OutputC<ILinearMember>;

action.post<InputC, OutputC>({ inputType: "InputC" }, async (data) => {
    /// 1) Check data.inputType
    
    let emp = await new Parse.Query(LinearMember).equalTo("employeeNumber", data.inputType.employeeNumber).first();
    if (emp){
        throw Errors.throw(Errors.CustomNotExists, [`EmployeeNumber is duplicate.`]);
    }
    
    
    try{
        
        let memberService = new MemberService();
        /// 2) Create Object
        
        
        //sipass and ccure requires this format
        let member = await memberService.createMember(data.inputType, data.user);
        let holder = await siPassAdapter.postCardHolder(member);

        let linearMember = await memberService.createLinearMember(data.inputType, data.user);
        linearMember.token= holder["Token"];
        var obj = new LinearMember(linearMember);
        
        let cCure800SqlAdapter = new CCure800SqlAdapter();
        //todo: we need to refactor this to accept linear membe instead of sipass object
        await cCure800SqlAdapter.writeMember(member, member.AccessRules.map(x=>x.ObjectName));

        await obj.save(null, { useMasterKey: true });
        await Log.Info(`create`, `${member.EmployeeNumber} ${member.FirstName}`, data.user, false, "Member");

        /// 2) Output
        return obj;
    }catch (err){
        console.log("member save error", JSON.stringify(err));
        throw Errors.throw(Errors.CustomNotExists, ["Error save member, please contact admin"]);
       
    }
});

/********************************
 * R: get object
 ********************************/


type InputR = Restful.InputR<ILinearMember>;
type OutputR = Restful.OutputR<ILinearMember>;

action.get<InputR, OutputR>({ inputType: "InputR" }, async (data) => {
    /// 1) Make Query
    let memberService = new MemberService();
    
    // 2) Filter data
    let filter = data.parameters as any;
    filter.ShowEmptyCardNumber="true";
    let query = memberService.getQuery(filter);
    query.select(...memberFields);
    query = Restful.Filter(query, data.inputType);
    /// 3) Output
    return Restful.Pagination(query, data.parameters);
});

/********************************
 * U: update object
 ********************************/
type InputU = Restful.InputU<IMember>;
type OutputU = Restful.OutputU<ICardholderObject>;

action.put<InputU, OutputU>({ inputType: "InputU" }, async (data) => {
    
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query(Member).get(objectId);
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [`Member <${objectId}> not exists.`]);
    let memberService = new MemberService();
    let member = await memberService.createMember(data.inputType, data.user);
    /// 2) Modify
    let update = new Member(member);

    if (member.Credentials[0]) {
        await checkCardNumber(member);
    }

	update.set("Vehicle1", { CarColor:"", CarModelNumber:"", CarRegistrationNumber: ""} );
	update.set("Vehicle2", { CarColor:"", CarModelNumber:"", CarRegistrationNumber: ""} );
	
	update.set("GeneralInformation", obj.get("GeneralInformation"));
	update.set("Status", obj.get("Status"));
    update.set("Token", obj.get("Token"));
    if(!data.inputType.isImageChanged){
        update.set("CardholderPortrait", obj.get("CardholderPortrait"));
    }
    update.set("GeneralInformation", obj.get("GeneralInformation"));
    
    
    try{
        /// 4) to SiPass
        let ret = ParseObject.toOutputJSON(update);
        //console.log("ret", ret);
        let sipassUpdate= await siPassAdapter.putCardHolder(ret);
        //console.log("sipassUpdate", JSON.stringify(sipassUpdate));
        //ret["Token"] = ret["Token"] + "" ;
    
        let cCure800SqlAdapter = new CCure800SqlAdapter();     
        await cCure800SqlAdapter.writeMember(ret ,ret.AccessRules.map(x=>x.ObjectName));
        
        /// 5) to Monogo        
        await update.save();
        await Log.Info(`update`, `${update.get("EmployeeNumber")} ${update.get("FirstName")}`, data.user, false, "Member");
    
        /// 3) Output
        return ret;
    }catch (err){
        console.log("member save error", JSON.stringify(err));
        throw Errors.throw(Errors.CustomNotExists, ["Error save member, please contact admin"]);
    }
    
});

/********************************
 * D: delete object
 ********************************/
type InputD = Restful.InputD<IMember>;
type OutputD = Restful.OutputD<ICardholderObject>;

action.delete<InputD, OutputD>({ inputType: "InputD" }, async (data) => {
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query(Member).equalTo("objectId", objectId).first();
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [`Member <${objectId}> not exists.`]);

    await  Log.Info(`delete`, `${obj.get("EmployeeNumber")} ${obj.get("FirstName")}`, data.user, false, "Member");
    try{
        
        if(obj.get("Token")&&obj.get("Token")!="-1")await siPassAdapter.delCardHolder(obj.get("Token"));
        let ret = ParseObject.toOutputJSON(obj);
        let cCure800SqlAdapter = new CCure800SqlAdapter();
        await cCure800SqlAdapter.writeMember(ret, ret.AccessRules.map(x=>x.ObjectName));

        obj.set("Status", 1);
        /// 2) Delete
        await obj.save();
    }catch(err){
        console.log("Delete member failed", JSON.stringify(err));
        throw Errors.throw(Errors.CustomNotExists, [`Delete member failed`]);
    }
    
    /// 3) Output
    return ParseObject.toOutputJSON(obj);
});
/// CRUD end ///////////////////////////////////

export default action;

async function checkCardNumber(member: any) {
    let cardno = member.Credentials[0].CardNumber;    
    console.log("checkCardNumber", cardno);
    if (cardno != "") {
        let cnt = await new Parse.Query(Member).equalTo("Credentials.CardNumber", cardno).first();
        if (cnt && (!member.objectId || member.objectId != ParseObject.toOutputJSON(cnt).objectId)) {            
            throw Errors.throw(Errors.CustomNotExists, [`Credentials.CardNumber is duplicate.`]);
        }
        let hStart = member.StartDate;
        let hEnd = member.EndDate;
        let cStart = member.Credentials[0].StartDate;
        let cEnd = member.Credentials[0].EndDate;
        if (cEnd <= cStart)
            throw Errors.throw(Errors.CustomNotExists, [`Credential Start and End Date should be within the Cardholder Start and End Date`]);
        if (hStart > cStart)
            throw Errors.throw(Errors.CustomNotExists, [`Credential Start and End Date should be within the Cardholder Start and End Date`]);
        if (hEnd < cStart)
            throw Errors.throw(Errors.CustomNotExists, [`Credential Start and End Date should be within the Cardholder Start and End Date`]);
    }
}


