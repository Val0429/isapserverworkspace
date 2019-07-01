import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors,
    Restful, FileHelper, ParseObject, IMember, Member, TimeSchedule
} from 'core/cgi-package';

import { IvieMember, vieMember } from 'workspace/custom/models/index';


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
    if(filter.DepartmentName) query.equalTo("CustomFields.FiledName", "CustomTextBoxControl5__CF_CF_CF").startsWith("CustomFields.FieldValue",filter.DepartmentName);
    if(filter.CostCenterName) query.equalTo("CustomFields.FiledName", "CustomTextBoxControl5__CF_CF_CF_CF").startsWith("CustomFields.FieldValue",filter.CostCenterName);
    if(filter.WorkAreaName) query.equalTo("CustomFields.FiledName", "CustomTextBoxControl5__CF_CF_CF_CF_CF_CF").startsWith("CustomFields.FieldValue",filter.WorkAreaName);
    if(filter.ResignationDate) query.equalTo("CustomFields.FiledName", "CustomDateControl1__CF").startsWith("CustomFields.FieldValue",filter.ResignationDate);
    
    let times = await new Parse.Query(TimeSchedule).limit(Number.MAX_SAFE_INTEGER).find(); 
    
    /// 3) Output
    let o = await query.limit(Number.MAX_SAFE_INTEGER).find();
    let outputData = o.map( (d) => ParseObject.toOutputJSON(d));
    for (let item of outputData) {
        for (let ru of item.AccessRules) {
            if(!ru.TimeScheduleToken) continue;
            let tsExists = times.find(x=>x.get("timeid") == ru.TimeScheduleToken);
            if(!tsExists) continue;
            ru.TimeScheduleToken = tsExists.get("timename");
        }        
    }

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
        let department = item.CustomFields && item.CustomFields.length > 0 ? item.CustomFields.find(x => x.FiledName == "CustomTextBoxControl5__CF_CF_CF") : undefined;
        let departmentName = department && department.FieldValue ? department.FieldValue : '';
        let costCenter = item.CustomFields && item.CustomFields.length > 0 ? item.CustomFields.find(x => x.FiledName == "CustomTextBoxControl5__CF_CF_CF_CF") : undefined;
        let costCenterName = costCenter && costCenter.FieldValue ? costCenter.FieldValue : '';
        let workArea = item.CustomFields && item.CustomFields.length > 0 ? item.CustomFields.find(x => x.FiledName == "CustomTextBoxControl5__CF_CF_CF_CF_CF_CF") : undefined;
        let workAreaName = workArea && workArea.FieldValue ? workArea.FieldValue : '';
        
        let resignation = item.CustomFields && item.CustomFields.length > 0 ? item.CustomFields.find(x => x.FiledName == "CustomDateControl1__CF") : undefined;
        let resignationDate = resignation && resignation.FieldValue ? resignation.FieldValue : '';
        let cardNumber = item.Credentials&&item.Credentials.length>0? item.Credentials.map(x => x.CardNumber)[0]:"";
        if (item.AccessRules && item.AccessRules.length > 0) {
            for (let accessRule of item.AccessRules) {
                records.push(createEmployee(item, cardNumber, departmentName, costCenterName, workAreaName, resignationDate,accessRule.TimeScheduleToken));
            }
        }
        else {
            records.push(createEmployee(item, cardNumber, departmentName, costCenterName, workAreaName, resignationDate, ""));
        }
    }
    if(!filter) return records;
    
    
    if(filter.PermissionList) records= records.filter(x=>x.PermissionList.toLowerCase().indexOf(filter.PermissionList.toLowerCase())>-1);

    return records;
}

function createEmployee(item: any,cardNumber:string,departmentName: string,costCenterName: string,workAreaName: string, resignationDate:string, accessRule: string) {
    return {
      FirstName: item.FirstName,
      LastName: item.LastName,
      EmployeeNumber: item.EmployeeNumber,
      CardNumber: cardNumber,
      DepartmentName: departmentName,
      CostCenterName: costCenterName,
      WorkAreaName: workAreaName,
      PermissionList: accessRule,
      ResignationDate:resignationDate
    }
  }