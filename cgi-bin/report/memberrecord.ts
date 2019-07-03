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
    CardType:"CustomDropdownControl1__CF"
}


var action = new Action({
    loginRequired: true,
    permission: [RoleList.Admin, RoleList.User]
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
    
    if(filter.LastName) query.startsWith("LastName", filter.LastName);
    if(filter.FirstName) query.startsWith("FirstName", filter.FirstName);    
    if(filter.EmployeeNumber) query.startsWith("EmployeeNumber", filter.EmployeeNumber);  
    if(filter.CardNumber) query.equalTo("Credentials.CardNumber", filter.CardNumber);
    if(filter.DepartmentName) query.equalTo("CustomFields.FiledName", fieldNames.DepartmentName).startsWith("CustomFields.FieldValue",filter.DepartmentName);
    if(filter.CostCenterName) query.equalTo("CustomFields.FiledName", fieldNames.CostCenterName).startsWith("CustomFields.FieldValue",filter.CostCenterName);
    if(filter.WorkAreaName) query.equalTo("CustomFields.FiledName", fieldNames.WorkAreaName).startsWith("CustomFields.FieldValue",filter.WorkAreaName);
    if(filter.CardCustodian) query.equalTo("CustomFields.FiledName", fieldNames.CardCustodian).startsWith("CustomFields.FieldValue",filter.CardCustodian);
    if(filter.CardType) query.equalTo("CustomFields.FiledName", fieldNames.CardType).startsWith("CustomFields.FieldValue",filter.CardType);
    if(filter.ResignationDate){
        let resignDate = moment(filter.ResignationDate).format("YYYY-MM-DD");
        query.equalTo("CustomFields.FiledName", fieldNames.ResignationDate).startsWith("CustomFields.FieldValue",resignDate);
    } 
    if(filter.EndDate){      
        let endDate = new Date(filter.EndDate);  
        query.lessThanOrEqualTo("EndDate", endDate);
    } 
    if(filter.StartDate){      
        let startDate = new Date(filter.StartDate);  
        query.greaterThanOrEqualTo("StartDate", startDate);
    } 
    if(filter.CompanyName) query.equalTo("CustomFields.FiledName", fieldNames.CompanyName).startsWith("CustomFields.FieldValue",filter.CompanyName);
    
    
    
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
        let PermissionTable = item.AccessRules && item.AccessRules.length>0 ? item.AccessRules.filter(x=>x.RuleType && x.RuleType == 4).map(x=>x.RuleToken) : [];
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