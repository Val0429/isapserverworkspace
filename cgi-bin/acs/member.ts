import { Action, Errors, Restful, ParseObject} from 'core/cgi-package';


import { ILinearMember, LinearMember } from '../../custom/models'
import { siPassAdapter } from '../../custom/services/acsAdapter-Manager';
import { CCure800SqlAdapter } from '../../custom/services/acs/CCure800SqlAdapter';
import { Log } from 'workspace/custom/services/log';
import MemberService, { memberFields } from 'workspace/custom/services/member-service';


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
        let res = await memberService.createMember(data.inputType, data.user.getUsername(), true);
        await Log.Info(`create`, `${res.get("employeeNumber")} ${res.get("chineseName")}`, data.user, false, "Member");
        return res;
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
    let query = memberService.getMemberQuery(filter);
    let getMemberFields = Object.assign([],memberFields);
    if(filter.showImage=="true"){
        getMemberFields.push("cardholderPortrait");
    }
    query.select(...getMemberFields);
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
    try{
        let memberService = new MemberService();
        let update = await memberService.updateMember(data.inputType, data.user.getUsername(), true);
        await Log.Info(`update`, `${update.get("employeeNumber")} ${update.get("chineseName")}`, data.user, false, "Member");
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
        let cardholder = await memberService.createSipassCardHolder(ret);
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




