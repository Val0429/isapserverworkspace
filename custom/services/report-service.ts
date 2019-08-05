import { Member, IMember, AttendanceRecords, Door, PermissionTable, TimeSchedule, AccessLevel, DoorGroup } from "../models";

import moment = require("moment");
import { ParseObject } from "helpers/parse-server/parse-helper";
import { data } from "jquery";
import { Restful } from "core/cgi-package";

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

export class ReportService{
    async getPermissionRecord(filter:any, limit:number=10000){
        /// 1) Make Query
        var query = new Parse.Query(PermissionTable)
            .equalTo("system", 0)
            .include("accesslevels.door")
            .include("accesslevels.doorgroup.doors")
            .include("accesslevels.floor")
            .include("accesslevels.floorgroup.floors")
            .include("accesslevels.timeschedule")
            .include("accesslevels.reader");

        if(filter.name){
            query.matches("tablename", new RegExp(filter.name), "i");
        }
        if(filter.timename){
            let tsQuery = new Parse.Query(TimeSchedule).matches("timename", new RegExp(filter.timename), "i");    
            let alQuery = new Parse.Query(AccessLevel).matchesQuery("timeschedule", tsQuery);    
            query.matchesQuery("accesslevels", alQuery);
        }
        if(filter.doorname){
            let doorQuery = new Parse.Query(Door).matches("doorname", new RegExp(filter.doorname), "i");    
            let alQuery = new Parse.Query(AccessLevel).matchesQuery("door", doorQuery);
            query.matchesQuery("accesslevels", alQuery);
        }
        if(filter.doorgroupname){
            let dgQuery = new Parse.Query(DoorGroup).matches("groupname", new RegExp(filter.doorgroupname), "i");    
            let alQuery = new Parse.Query(AccessLevel).matchesQuery("doorgroup", dgQuery);
            query.matchesQuery("accesslevels", alQuery);
        }
        
        
        let o = await query.limit(limit).find();
        let results = o.map(x=> ParseObject.toOutputJSON(x));
        return results;
    }
    async getAttendanceRecord(filter:any, limit:number=10000){
        let query = new Parse.Query(AttendanceRecords)
        .exists("card_no")
        .notEqualTo("card_no", "")
        .addAscending("card_no")
        .addAscending("date_occurred")
        .addAscending("time_occurred");

        if (filter.CardNumber) {
            query.matches("card_no", new RegExp(filter.CardNumber), "i");
        }
        if (filter.start) {
            let start = new Date(filter.start);        
            query.greaterThanOrEqualTo("date_time_occurred", start);
        }
        if (filter.end) {
            let end = new Date(filter.end);
            query.lessThanOrEqualTo("date_time_occurred", end);
        }
        let results = [];
        let records = await query.limit(limit).find();
        
        for(let record of records.map(x=>ParseObject.toOutputJSON(x))){
            if (!record.date_occurred || !record.date_time_occurred) continue;        
            let thisDayRecords = results.filter(x=>x.date_occurred == record.date_occurred && x.card_no == record.card_no);
            let at_id = await new Parse.Query(Door).equalTo("doorid", record.at_id).first();
            if(at_id)  record.at_id = at_id.get('doorname');
            //start, assume in and out at the same time
            if(thisDayRecords.length<2){
                results.push(Object.assign({},record));
                results.push(Object.assign({},record));
            }
            //update out / end record
            else {            
                for(const key of Object.keys(record)){
                    thisDayRecords[1][key] = record[key];
                }            
            } 
            
        }
        return results;
    }
    async getMemberRecord(filter:any, limit:number=10000){
        /// 1) Make Query
        var query = new Parse.Query(Member);      
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
        let o = await query.limit(limit).find();
        let members = o.map(x=>ParseObject.toOutputJSON(x));
        let results = this.constructData(members);
        return results;
    }
    private getCustomFieldValue(item:IMember, fieldName:string){
        let field = item.CustomFields && item.CustomFields.length > 0 ? item.CustomFields.find(x => x.FiledName == fieldName) : undefined;
        return field && field.FieldValue ? field.FieldValue : '';
    }
    private createEmployee(item: any) {
    
        let DepartmentName = this.getCustomFieldValue(item, fieldNames.DepartmentName);        
        let CostCenterName = this.getCustomFieldValue(item, fieldNames.CostCenterName);                
        let WorkAreaName = this.getCustomFieldValue(item, fieldNames.WorkAreaName);                
        let CompanyName = this.getCustomFieldValue(item, fieldNames.CompanyName);        
        let ResignationDate = this.getCustomFieldValue(item, fieldNames.ResignationDate);
        let CardCustodian = this.getCustomFieldValue(item, fieldNames.CardCustodian);
        let CardType = this.getCustomFieldValue(item, fieldNames.CardType);
        let CardNumber = item.Credentials&&item.Credentials.length>0? item.Credentials.map(x => x.CardNumber)[0]:"";
        let PermissionTable = item.AccessRules && item.AccessRules.length>0 ? item.AccessRules.filter(x=>x.RuleType && x.RuleType == 4).map(x=>parseInt(x.RuleToken)) : [];
        return {
            objectId:item.objectId,
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
  private constructData(dataMember: IMember[]) {
    let records:any=[];
    for (let item of dataMember) {
        records.push(this.createEmployee(item));
    }   
    
    return records;
}
}