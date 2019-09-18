import { AttendanceRecords, DailyAttendance } from "../models";

import moment = require("moment");




export class ReportService{
    
    getDailyAttendanceQuery(filter:any, limit:number=10000, skip:number=0){
        let query = new Parse.Query(DailyAttendance)        
        .include("member")
        .include("door")
        .include("attendanceStart.door")
        .include("attendanceEnd.door")        
        .limit(limit)
        .skip(skip);
        //console.log("filter attendance", filter);
        if (filter.CardNumber) {
            query.matches("cardNumber", new RegExp(filter.CardNumber), "i");
        }
        if (filter.Start) {
            let start = new Date(filter.Start);        
            query.greaterThanOrEqualTo("dateOccurred", moment(start).format("YYYYMMDD"));
        }
        if (filter.End) {
            let end = new Date(filter.End);
            query.lessThanOrEqualTo("dateOccurred", moment(end).format("YYYYMMDD"));
        }
        
        return query;
    }
    mapAccessRow(access: any) {
        let newAccess: any = {
            permissionName: access.permissiontable ? access.permissiontable.tablename : undefined,
            doorGroupName: access.doorgroup ? access.doorgroup.groupname : undefined,
            doorName: access.door ? access.door.doorname : undefined,
            timeSchedule: access.timeschedule ? access.timeschedule.timename : undefined
        };
        if (access.member) {
            newAccess.cardNumber = access.member.cardNumber;
            newAccess.department = access.member.department;
            newAccess.costCenter = access.member.costCenter;
            newAccess.chineseName = access.member.chineseName;
            newAccess.englishName = access.member.englishName;
            newAccess.companyName = access.member.companyName;
            newAccess.workArea = access.member.workArea;
            newAccess.employeeNumber = access.member.employeeNumber;
            newAccess.resignationDate = access.member.resignationDate;
            newAccess.status = access.member.status;
        }
        return newAccess;
    }
    getMapFields(fields: any) {
        let newFields = [];
        for (let field of fields) {
            switch (field) {
                case "cardNumber":
                    newFields.push("member." + field);
                    break;
                case "department":
                    newFields.push("member." + field);
                    break;
                case "costCenter":
                    newFields.push("member." + field);
                    break;
                case "chineseName":
                    newFields.push("member." + field);
                    break;
                case "englishName":
                    newFields.push("member." + field);
                    break;
                case "companyName":
                    newFields.push("member." + field);
                    break;
                case "workArea":
                    newFields.push("member." + field);
                    break;
                case "employeeNumber":
                    newFields.push("member." + field);
                    break;
                case "resignationDate":
                    newFields.push("member." + field);
                    break;
                case "status":
                    newFields.push("member." + field);
                    break;
                case "permissionName":
                    newFields.push("permissiontable.tablename");
                    break;
                case "doorGroupName":
                    newFields.push("doorgroup.groupname");
                    break;
                case "doorName":
                    newFields.push("door.doorname");
                    break;
                case "timeSchedule":
                    newFields.push("timeschedule.timename");
                    break;
            }
        }
        return newFields;
    }
     
    
    
}