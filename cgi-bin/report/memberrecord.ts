import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors,
    Restful, FileHelper, ParseObject, IMember, Member
} from 'core/cgi-package';

import { IvieMember, vieMember } from 'workspace/custom/models/index';


var action = new Action({
    //loginRequired: true,
    postSizeLimit: 1024*1024*10,
    permission: [RoleList.Admin, RoleList.User]
});



/********************************
 * R: get object
 ********************************/
type InputR = Restful.InputR<any>;
type OutputR = Restful.OutputR<IMember>;

action.get<InputR, OutputR>({ inputType: "InputR" }, async (data) => {    
    /// 1) Make Query
    var query = new Parse.Query(Member);   
    /// 2) Filter query 
    let filter = data.parameters;
    
    if(filter.LastName) query.startsWith("LastName", filter.LastName);
    if(filter.FirstName) query.startsWith("FirstName", filter.FirstName);    
    if(filter.EmployeeNumber) query.startsWith("EmployeeNumber", filter.EmployeeNumber);  
    if(filter.CardNumber) query.equalTo("Credentials.CardNumber", filter.CardNumber);
    if(filter.DepartmentName) query.equalTo("CustomFields.FiledName", "CustomTextBoxControl5__CF_CF_CF").startsWith("CustomFields.FieldValue",filter.DepartmentName);
    if(filter.CostCenterName) query.equalTo("CustomFields.FiledName", "CustomTextBoxControl5__CF_CF_CF_CF").startsWith("CustomFields.FieldValue",filter.CostCenterName);
    if(filter.WorkAreaName) query.equalTo("CustomFields.FiledName", "CustomTextBoxControl5__CF_CF_CF_CF_CF_CF").startsWith("CustomFields.FieldValue",filter.WorkAreaName);
    
    /// 3) Output
    let o = await query.limit(Number.MAX_SAFE_INTEGER).find();    
    let results = constructData(o.map( (d) => ParseObject.toOutputJSON(d)), filter);
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
        let department = item.CustomFields && item.CustomFields.length > 0 ? item.CustomFields.find(x => x.FiledName == "CustomTextBoxControl5__CF_CF_CF") : undefined;
        let departmentName = department && department.FieldValue ? department.FieldValue : '';
        let costCenter = item.CustomFields && item.CustomFields.length > 0 ? item.CustomFields.find(x => x.FiledName == "CustomTextBoxControl5__CF_CF_CF_CF") : undefined;
        let costCenterName = costCenter && costCenter.FieldValue ? costCenter.FieldValue : '';
        let workArea = item.CustomFields && item.CustomFields.length > 0 ? item.CustomFields.find(x => x.FiledName == "CustomTextBoxControl5__CF_CF_CF_CF_CF_CF") : undefined;
        let workAreaName = workArea && workArea.FieldValue ? workArea.FieldValue : '';
        if (item.AccessRules && item.AccessRules.length > 0) {
            for (let accessRule of item.AccessRules) {
                records.push(createEmployee(item, departmentName, costCenterName, workAreaName, accessRule.ObjectName));
            }
        }
        else {
            records.push(createEmployee(item, departmentName, costCenterName, workAreaName, ""));
        }
    }
    if(!filter) return records;
    
    
    if(filter.PermissionList) records= records.filter(x=>x.PermissionList.toLowerCase().indexOf(filter.PermissionList.toLowerCase())>-1);

    return records;
}

function createEmployee(item: any,departmentName: string,costCenterName: string,workAreaName: string, accessRule: string) {
    return {
      FirstName: item.FirstName,
      LastName: item.LastName,
      EmployeeNumber: item.EmployeeNumber,
      CardNumber: item.Credentials&&item.Credentials.length>0? item.Credentials.map(x => x.CardNumber).join(", "):"",
      DepartmentName: departmentName,
      CostCenterName: costCenterName,
      WorkAreaName: workAreaName,
      PermissionList: accessRule
    }
  }