import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors,
    Restful, FileHelper, ParseObject, IMember, Member, TimeSchedule
} from 'core/cgi-package';

import * as moment from 'moment';

const fieldNames = {
    DepartmentName:"CustomTextBoxControl5__CF_CF_CF",
    CostCenterName:"CustomTextBoxControl5__CF_CF_CF_CF",
    WorkAreaName:"CustomTextBoxControl5__CF_CF_CF_CF_CF_CF",
    ResignationDate:"CustomDateControl1__CF",
    CompanyName:"CustomTextBoxControl6__CF",
    CardCustodian:"CustomTextBoxControl2__CF",
    CardType:"CustomDropdownControl1__CF",
    CardNumber:"Credentials.CardNumber",
    RuleToken:"AccessRules.RuleToken",
    CardEndDate:"Credentials.EndDate"
}


var action = new Action({
    loginRequired: true,
    // permission: [RoleList.Admin, RoleList.User]
});



/********************************
 * R: get object
 ********************************/
type InputR = Restful.InputR<any>;
type OutputR = Restful.OutputR<any>;

action.get<InputR, OutputR>({ inputType: "InputR" }, async (data) => {    
    /// 1) Make Query
    var query = new Parse.Query(Member);   
    /// 2) Filter query 
    let filter = data.parameters;    
    console.log("filter", filter);
    if(filter.LastName) query.matches("LastName", new RegExp(filter.LastName), "i");
    if(filter.FirstName) query.matches("FirstName", new RegExp(filter.FirstName), "i");    
    if(filter.EmployeeNumber) query.matches("EmployeeNumber", new RegExp(filter.EmployeeNumber), "i");  
    let cf = "CustomFields.FiledName";
    let fv = "CustomFields.FieldValue";
    if(filter.DepartmentName) query.equalTo(cf, fieldNames.DepartmentName).matches(fv,new RegExp(filter.DepartmentName), "i");
    if(filter.CostCenterName) query.equalTo(cf, fieldNames.CostCenterName).matches(fv,new RegExp(filter.CostCenterName), "i");
    if(filter.WorkAreaName) query.equalTo(cf, fieldNames.WorkAreaName).matches(fv,new RegExp(filter.WorkAreaName), "i");
    if(filter.CardCustodian) query.equalTo(cf, fieldNames.CardCustodian).matches(fv,new RegExp(filter.CardCustodian), "i");
    if(filter.CardType) query.equalTo(cf, fieldNames.CardType).matches(fv,new RegExp(filter.CardType), "i");
    if(filter.CompanyName) query.equalTo(cf, fieldNames.CompanyName).matches(fv, new RegExp(filter.CompanyName), "i");
    
    if(filter.ResignationDate){
        let resignDate = moment(filter.ResignationDate).format("YYYY-MM-DD");
        query.equalTo(cf, fieldNames.ResignationDate).matches(fv, new RegExp(resignDate), "i");
    } 
    if(filter.CardNumber) query.matches(fieldNames.CardNumber, new RegExp(filter.CardNumber), "i");    
    else if(!filter.ShowEmptyCardNumber) query.exists(fieldNames.CardNumber).notEqualTo(fieldNames.CardNumber, "");
    
    if(filter.CardNumbers) query.containedIn(fieldNames.CardNumber, filter.CardNumbers.split(","));
    
    if(filter.PermissionTable) query.containedIn(fieldNames.RuleToken, filter.PermissionTable.split(",").map(x=>x.toString()));
    if(filter.expired && filter.expired=="true"){
        query.lessThanOrEqualTo(fieldNames.CardEndDate, (new Date()).toISOString());
    }
    /// 3) Output
    let o = await query.limit(Number.MAX_SAFE_INTEGER).find();
    let outputData = o.map( (d) => ParseObject.toOutputJSON(d));
    
    let results = constructData(outputData, filter);
    let paging :any = {
        page: 1,
        pageSize: Number.MAX_SAFE_INTEGER,
        total: results.length,
        totalPages: 1
    };
    return {paging, results};
});


export default action;
function constructData(dataMember: IMember[], filter?:any) {
    let records:any=[];
    for (let item of dataMember) {
        records.push(createEmployee(item));
    }   
    
    return records;
}
function getCustomFieldValue(item:IMember, fieldName:string){
    let field = item.CustomFields && item.CustomFields.length > 0 ? item.CustomFields.find(x => x.FiledName == fieldName) : undefined;
    return field && field.FieldValue ? field.FieldValue : '';
}
function createEmployee(item: any) {
    
        let DepartmentName = getCustomFieldValue(item, fieldNames.DepartmentName);        
        let CostCenterName = getCustomFieldValue(item, fieldNames.CostCenterName);                
        let WorkAreaName = getCustomFieldValue(item, fieldNames.WorkAreaName);                
        let CompanyName = getCustomFieldValue(item, fieldNames.CompanyName);        
        let ResignationDate = getCustomFieldValue(item, fieldNames.ResignationDate);
        let CardCustodian = getCustomFieldValue(item, fieldNames.CardCustodian);
        let CardType = getCustomFieldValue(item, fieldNames.CardType);
        let CardNumber = item.Credentials&&item.Credentials.length>0? item.Credentials.map(x => x.CardNumber)[0]:"";
        let PermissionTable = item.AccessRules && item.AccessRules.length>0 ? item.AccessRules.filter(x=>x.RuleType && x.RuleType == 4).map(x=>parseInt(x.RuleToken)) : [];
        return {
            FirstName: item.FirstName,
            LastName: item.LastName,
            EmployeeNumber: item.EmployeeNumber,
            CardNumber,
            DepartmentName,
            CostCenterName,
            WorkAreaName,
            ResignationDate:ResignationDate.split("T")[0],
            CompanyName,
            PermissionTable,
            CardCustodian,
            CardType,
            StartDate:moment(item.StartDate).format("YYYY-MM-DD"),
            EndDate:moment(item.EndDate).format("YYYY-MM-DD")
        }
  }