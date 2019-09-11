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
    
    
     
    
    
}