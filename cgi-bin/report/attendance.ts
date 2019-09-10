import { Action, Restful, ParseObject} from 'core/cgi-package';

import { ReportService } from 'workspace/custom/services/report-service';
import moment = require('moment');
import MemberService from 'workspace/custom/services/member-service';
import { mongoDBUrl } from 'helpers/mongodb/url-helper';


var action = new Action({
    loginRequired: true,
    apiToken: "report_attendance_R"
});



/********************************
 * R: get object
 ********************************/


action.post(async (data) => {
    
    let reportService = new ReportService();
    let memberService = new MemberService();
    let filter = data.parameters as any;
    let pageSize = filter.paging.pageSize || 10;
    let page = filter.paging.page || 1;
    let fields = filter.selectedColumns.map(x=>"member."+x.key);
    fields.push("door.doorname");
    let attendanceQuery = reportService.getAttendanceQuery(filter, pageSize, (page-1)*pageSize);
    console.log("filter", filter);
    attendanceQuery.include("member");
    attendanceQuery.include("door");
    attendanceQuery.select(...fields);
    // const mongoist = require('mongoist');
    // const db = mongoist(mongoDBUrl());

    let memberQuery = memberService.getMemberQuery(filter);
    attendanceQuery.matchesQuery("member", memberQuery);
    // console.log("member query",memberQuery.toJSON());
    // console.log("attendance query", attendanceQuery.toJSON());

    // let records = await db.collection("AttendanceRecord").findAsCursor(attendanceQuery.toJSON().where).skip((page-1)*pageSize).limit(pageSize).toArray();
    // console.log("records", records);


    let total = await attendanceQuery.count();
    let oAttendances = await attendanceQuery.find();
    let attendances = oAttendances.map(x=>ParseObject.toOutputJSON(x));
    
    
    for(let item of attendances){        
        let newDoor = item.door;
        let newMember = item.member;
        delete(newMember.objectId);
        delete(newDoor.objectId);
        delete(item.member);
        delete(item.door);
        //merge fields
        Object.assign(item, newMember);
        Object.assign(item, newDoor);
        //let item2:any = {};        
        //if(!item2 || item2.card_no != item.card_no)continue;
        
        // item.date_time_occurred_end = item2.date_time_occurred;
        // item.at_id_end = item2.at_id;
        let timeStart = moment(item.date_time_occurred);
        let timeEnd = moment(item.date_time_occurred_end);
        item.startTime = timeStart.format("HH:mm:ss");
        item.dateOccurred = timeStart.format("YYYY-MM-DD");
        item.endTime = timeEnd.format("HH:mm:ss");
        item.workTime = moment.utc(timeEnd.diff(timeStart)).format("H[h ]m[m ]s[s]");
        
        
    }

    /// 3) Output
    return {
        paging:{
            page:1,
            pageSize,
            total,
            totalPages:Math.ceil(attendances.length / pageSize)
        },
        results:attendances
    };
});


export default action;
