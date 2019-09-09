import { Member, AttendanceRecords, Door, PermissionTable, TimeSchedule, AccessLevel, DoorGroup, IMember } from "../models";

import moment = require("moment");
import { ParseObject } from "helpers/parse-server/parse-helper";
import { ICardholderObject, ICustomFields } from "../modules/acs/sipass";
import { memberFields, CustomFields } from "./member-service";


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
    async getPermissionRecord(filter:any, limit:number=10000, skip:number=0){
        /// 1) Make Query
        var query = new Parse.Query(PermissionTable)
            .equalTo("system", 0)
            .ascending("tablename")
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
        
        
        let o = await query.skip(skip).limit(limit).find();
        let results = o.map(x=> ParseObject.toOutputJSON(x));
        let total = await query.count();
        return {results, total};
    }
    async getAttendanceRecord(filter:any, limit:number=10000, skip:number=0){
        let query = new Parse.Query(AttendanceRecords)
        //.include("member")
        .include("door")
        .equalTo("type", 21)
        .equalTo("state_id", 2)
        .exists("card_no")
        .notEqualTo("card_no", "")
        .addAscending("card_no")
        .addAscending("date_occurred")
        .addAscending("time_occurred");
        console.log("filter attendance", filter);
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
        let records = await query.skip(skip).limit(limit).find();
        let attendances = records.map(x=>ParseObject.toOutputJSON(x));
        console.log("attendances.length", attendances.length);
        let memberIds = attendances.map(x=>x.member ? x.member.objectId : "").filter(x=>x);
        console.log("memberIds.length", memberIds.length);
        let total = await query.count();        
        filter.objectIds = memberIds;
        let normalizedMembers = await this.getMemberRecord(filter, limit, skip);
        console.log("normalizedMembers.length", normalizedMembers.results.length);
        for(let record of attendances){
            if (!record.date_occurred || !record.date_time_occurred ||!record.member || !record.door) continue;
            //normalize member
            
            let newMember = normalizedMembers.results.find(x=>x.objectId==record.member.objectId);
            if(!newMember)continue;                
            record.memberObjectId = newMember.objectId;
            delete(newMember.objectId);
            delete(record.member);
            //merge field
            Object.assign(record, newMember);
        
            //todo we can change this field later                
            record.at_id = record.door.doorname;
            delete(record.door);
            
            let thisDayRecords = results.filter(x=>x.date_occurred == record.date_occurred && x.card_no == record.card_no);           
            
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
        
        return {results, total};
    }
    async getMemberRecord(filter:any, limit:number=10000, skip:number=0){
        let defaultMemberFields = Object.assign([], memberFields);
        if(filter.showImage=="true"){
            defaultMemberFields.push("CardholderPortrait");
        }
        //console.log("defaultMemberFields", defaultMemberFields)
        /// 1) Make Query
        var query = new Parse.Query(Member)
                    .notEqualTo("Status", 1)
                    .select(...defaultMemberFields)
                    .ascending("LastName");      
        //console.log("filter member", filter);
        
        if (filter.objectId) {
            query.equalTo("objectId", filter.objectId);
        }
        if(filter.objectIds && Array.isArray(filter.objectIds)){
            query.containedIn("objectId", filter.objectIds);
        }
        // looking for duplication
        if (filter.eEmployeeNumber) query.equalTo("EmployeeNumber",  filter.eEmployeeNumber);
        if (filter.eCardNumber) query.equalTo("Credentials.CardNumber", filter.eCardNumber);
        if (filter.start2 && filter.end2) {
            query.lessThanOrEqualTo("EndDate", filter.end2).greaterThanOrEqualTo("EndDate", filter.start2);
        }
        if (filter.start1 && filter.end1) {
            query.lessThanOrEqualTo("StartDate", filter.end1).greaterThanOrEqualTo("StartDate", filter.start1);
        }
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
        //console.log("beep1")
        let o = await query.skip(skip).limit(limit).find();
        //console.log("beep2")
        let total = await query.count();
        //console.log("beep3")
        let members:ICardholderObject[] = o.map(x=>ParseObject.toOutputJSON(x));
        //console.log("beep4")
        let results = this.constructData(members);
        //console.log("beep5")
        return {results, total};
    }
    
    private constructData(dataMember: ICardholderObject[]) {
        let records:IMember[]=[];
        for (let item of dataMember) {
            records.push(this.normalizeMember(item));
        }   
        
        return records;
    }
    private getFieldValue(fieldName:string, customFields:ICustomFields[], isDate:boolean){      
        if(!customFields)return "";
        let exists = customFields.find(x=>x.FiledName == fieldName);
        let value = exists ? (exists.FieldValue || "") : "";
        try{        
            return isDate && value ?  moment(value).format("YYYY-MM-DD"): value;
          }catch(err){
            console.error(err);
            return "";
          }    
    }
    private normalizeMember(member:ICardholderObject):IMember { 
        let newMember:any = {};
          
        newMember.objectId = member.objectId;      
        newMember.void = member.Attributes && member.Attributes.Void? member.Attributes.Void:false;
        newMember.permissionTable = member.AccessRules && member.AccessRules.length > 0 ? 
                                    member.AccessRules.filter(x=>x.RuleType && x.RuleType == 4)
                                    .map(x=>parseInt(x.RuleToken)) : [];
        
        newMember.personType = member.PrimaryWorkgroupId;
        newMember.employeeNumber = member.EmployeeNumber;      
        newMember.chineseName = member.LastName;
        newMember.englishName = member.FirstName;
        newMember.primaryWorkgroupName=member.PrimaryWorkgroupName;
        newMember.primaryWorkgroupId=member.PrimaryWorkgroupId;
        let credential = member.Credentials && member.Credentials.length>0 ?  member.Credentials[0]: {};
          
        newMember.cardNumber = credential.CardNumber || "";
        newMember.cardAllNumber = credential.CardNumber || "";
        newMember.cardCertificate = (credential.ProfileId || 0).toString();
        newMember.deviceNumber = credential.FacilityCode || "";
        newMember.pinDigit = credential.PinDigit|| "";
        newMember.profileName = credential.ProfileName|| "";
        newMember.technologyCode = credential.CardTechnologyCode|| "";    
        newMember.pinMode = credential.PinMode|| "";
        newMember.pin = credential.Pin || "0";
        newMember.startDate = moment(member.StartDate).format("YYYY-MM-DD");
        newMember.endDate =moment(member.EndDate).format("YYYY-MM-DD");;
        newMember.cardholderPortrait = member.CardholderPortrait? ("data:image/png;base64,"+member.CardholderPortrait) : "";

        // tab2
        if (member.PersonalDetails) {
            if(member.PersonalDetails.UserDetails){
                newMember.account = member.PersonalDetails.UserDetails.UserName;
                newMember.password = member.PersonalDetails.UserDetails.Password;
            }
            if(member.PersonalDetails.ContactDetails){
                newMember.email = member.PersonalDetails.ContactDetails.Email;
                newMember.phone = member.PersonalDetails.ContactDetails.PhoneNumber;
                newMember.extensionNumber = member.PersonalDetails.ContactDetails.MobileNumber;
            }
            if (member.PersonalDetails.DateOfBirth) {          
                newMember.birthday = member.PersonalDetails.DateOfBirth;          
            }
        }else{
            newMember.account = "";
            newMember.password = "";
            newMember.email = "";
            newMember.phone = "";
            newMember.extensionNumber = "";       
            newMember.birthday = "";
        }
        //custom fields      
        for(let field of CustomFields){
            if(field.name=="lastEditTime"){
                newMember[field.name] = moment(newMember[field.name] ).format("YYYY-MM-DD HH:mm:ss");
            }else{
                newMember[field.name] = this.getFieldValue(field.fieldName, member.CustomFields, field.date);
            }
        }
        return newMember;
      }
    
}