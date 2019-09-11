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
        if (filter.start) {
            let start = new Date(filter.start);        
            query.greaterThanOrEqualTo("dateOccurred", moment(start).format("YYYYMMDD"));
        }
        if (filter.end) {
            let end = new Date(filter.end);
            query.lessThanOrEqualTo("dateOccurred", moment(end).format("YYYYMMDD"));
        }
        return query;
    }
    getAttendanceQuery(filter:any, limit:number=10000, skip:number=0){
        let query = new Parse.Query(AttendanceRecords)        
        // .include("member")
        // .include("door")
        .exists("member")
        .exists("door")
        .equalTo("type", 21)
        .equalTo("state_id", 2)
        .exists("card_no")
        .addAscending("card_no")
        .addAscending("date_occurred")
        .addAscending("time_occurred")        
        .limit(limit)
        .skip(skip);
        //console.log("filter attendance", filter);
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
        return query;
    }
    
     
    
    
}