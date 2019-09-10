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
    
    
    
    try{
        
        let memberService = new MemberService();
        /// 2) Create Object
        
        
        //sipass and ccure requires this format
        let member = await memberService.createSipassCardHolder(data.inputType, data.user);
        let holder = await siPassAdapter.postCardHolder(member);

        let linearMember = await memberService.createLinearMember(data.inputType, data.user);
        await checkDuplication(linearMember);
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
type InputU = Restful.InputU<ILinearMember>;
type OutputU = Restful.OutputU<ILinearMember>;

action.put<InputU, OutputU>({ inputType: "InputU" }, async (data) => {
    
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query(LinearMember).get(objectId);
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [`Member <${objectId}> not exists.`]);
    try{
        let memberService = new MemberService();
        let member = await memberService.createSipassCardHolder(data.inputType, data.user);
        member.Status= obj.get("status");
        member.Token, obj.get("token");
        /// 2) Modify
        let linearMember = await memberService.createLinearMember(data.inputType, data.user);
        let update = new LinearMember(linearMember);
        update.set("status", obj.get("status"));
        update.set("token", obj.get("token"));
        await checkDuplication(linearMember);
        /// 4) to SiPass
       
        let sipassUpdate= await siPassAdapter.putCardHolder(member);
        
    
        let cCure800SqlAdapter = new CCure800SqlAdapter();     
        await cCure800SqlAdapter.writeMember(member,member.AccessRules.map(x=>x.ObjectName));
        
        /// 5) to Monogo        
        await update.save();
        await Log.Info(`update`, `${update.get("employeeNumber")} ${update.get("chineseName")}`, data.user, false, "Member");
    
        /// 3) Output
        return update;
    }catch (err){
        console.log("member save error", JSON.stringify(err));
        throw Errors.throw(Errors.CustomNotExists, ["Error save member, please contact admin"]);
    }
    
});

/********************************
 * D: delete object
 ********************************/
type InputD = Restful.InputD<ILinearMember>;
type OutputD = Restful.OutputD<ILinearMember>;

action.delete<InputD, OutputD>({ inputType: "InputD" }, async (data) => {
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query(LinearMember).equalTo("objectId", objectId).first();
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [`Member <${objectId}> not exists.`]);

   
    try{
        
       
        obj.set("status", 1);
        let ret = ParseObject.toOutputJSON(obj);
        let memberService = new MemberService();
        let cardholder = await memberService.createSipassCardHolder(ret,data.user);
        cardholder.Status=1;
        let cCure800SqlAdapter = new CCure800SqlAdapter();
        await cCure800SqlAdapter.writeMember(cardholder, cardholder.AccessRules.map(x=>x.ObjectName));

        if(obj.get("token")&&obj.get("token")!="-1")await siPassAdapter.delCardHolder(obj.get("token"));
        /// 2) Delete
        await obj.save();

        await  Log.Info(`delete`, `${obj.get("employeeNumber")} ${obj.get("chineseName")}`, data.user, false, "Member");
    }catch(err){
        console.log("Delete member failed", JSON.stringify(err));
        throw Errors.throw(Errors.CustomNotExists, [`Delete member failed`]);
    }
    
    /// 3) Output
    return ParseObject.toOutputJSON(obj);
});
/// CRUD end ///////////////////////////////////

export default action;

async function checkDuplication(member: ILinearMember) {
    let emp = await new Parse.Query(LinearMember).notEqualTo("status",1).equalTo("employeeNumber", member.employeeNumber).first();
    if (emp && (!member.objectId || member.objectId != ParseObject.toOutputJSON(emp).objectId)){
        throw Errors.throw(Errors.CustomNotExists, [`EmployeeNumber is duplicate.`]);
    }
    
    let cardno = member.cardNumber;    
    console.log("checkCardNumber", cardno);
    if (cardno) {
        let cnt = await new Parse.Query(Member).notEqualTo("status",1).equalTo("cardNumber", cardno).first();
        if (cnt && (!member.objectId || member.objectId != ParseObject.toOutputJSON(cnt).objectId)) {            
            throw Errors.throw(Errors.CustomNotExists, [`Credentials.CardNumber is duplicate.`]);
        }
        
    }
}


