import { Log } from './log';

import { AttendanceRecords, Reader, Door, LinearMember, DailyAttendance } from 'workspace/custom/models/index';

import { siPassAdapter } from './acsAdapter-Manager';
import { ParseObject } from 'core/cgi-package';
import moment = require('moment');
import { CCUREService } from '../modules/acs/CCURE';


// import { CCUREReader } from './ccureReader'
// import { QueryContent } from './queryMap'
// import { SignalObject } from "./signalObject";


export class AttendanceRecord {
    private waitTimer = null;
    private startDelayTime: number = 1 // sec
    private cycleTime: number = 300; // sec



    constructor() {
        var me = this;

        // 1.0 Login to Datebase
        Log.Info(`${this.constructor.name}`, `1.0 Login database connection`);
      

        this.waitTimer = setTimeout(async () => {
           await me.doAccessControlSync();
        }, 1000 * this.startDelayTime);
    }


    async doAccessControlSync() {
        Log.Info(`${this.constructor.name}`, `2.0 Timer Check`);

        let now: Date = new Date();

        clearTimeout(this.waitTimer);

        if (now.getMinutes() == 5) {  // Startup @XX:05
        //if (now.getMinutes() != 70) {
            // 0.0 Initial Adapter
            Log.Info(`${this.constructor.name}`, `0.0 Initial Adapter`);

            // 2.0 Query Records
            await this.getSipassData();


            await this.getCCureData();
           
            
        }

        now = new Date();
        var s = (now.getMinutes() * 60 + now.getSeconds()) % this.cycleTime;
        Log.Info(`${this.constructor.name}`, `Timer Check wait for [ ${this.cycleTime - s} ] sec`);

        this.waitTimer = setTimeout(async () => {
           await this.doAccessControlSync();
        }, (this.cycleTime - s) * 1000);
    } 
    private async getCCureData() {
        Log.Info(`${this.constructor.name}`, `2.0 Query Records from CCure800`);
        try {
            let ccureService = new CCUREService();
            await ccureService.Login();
            let records = await ccureService.GetOrganizedNewReport();
            console.log("getCCureData", records.length);
            //batch by 100 to prevent out of memory / stack
            while (records.length > 100) {
                await this.saveCCureData(records.splice(0, 100));
            }
            await this.saveCCureData(records);
        }
        catch (err) {
            console.error("cannot get data from ccure", err);
        }
    }

    async getSipassData() {        
        try{      
            Log.Info(`${this.constructor.name}`, `2.0 Query Records from SiPass`);
            var offset = 0;// (new Date().getTimezoneOffset() / 60) * -1;
            console.log("offset",offset);
            let dt = new Date();
            var end = new Date(dt.getTime() + offset*3600*1000);
            console.log(end.toISOString());
            var begin = new Date(dt.getTime() + (offset-1)*3600*1000);                
            console.log(begin.toISOString());
            
            let records = await siPassAdapter.getRecords(begin, end);
            console.log("sipass records",records.length);
            //batch by 100 to prevent out of memory / stack
            while (records.length > 100) {
                await this.saveSipassData(records.splice(0, 100));
            }
            await this.saveSipassData(records);
        }catch(err){
            console.log("cannot get data from sipass", JSON.stringify(err));
        }
    }
    private async saveSipassData(records: any[]) {
        let objects = [];
        let members = await new Parse.Query(LinearMember)
                        .select("cardNumber")
                        .limit(records.length)
                        .containedIn("cardNumber", records.map(x => x.card_no))
                        .find();

        let dailyAttendances = await new Parse.Query(DailyAttendance)
                        .containedIn("dateOccurred", records.map(r=>r["date_occurred"]))
                        .containedIn("cardNumber", records.map(r=>r["card_no"]))
                        .limit(records.length).find();
        let readers = await new Parse.Query(Reader).limit(records.length)
            .containedIn("readername", records.map(x => x["point_name"]))
            .find();
        for (let r of records) {
            //skip this record
            if(r["type"]!= 21 || r["state_id"] !=2)continue;
            
            let dateTime = r["date_occurred"] + r["time_occurred"];
            r["date_time_occurred"] = moment(dateTime, 'YYYYMMDDHHmmss').toDate();
            r["system"] = 1;
            let o = new AttendanceRecords(r);
            let reader = readers.find(x => x.get("readername") == r["point_name"]);
            //console.log("reader", reader, record.point_name);
            if (reader) {
                let door = await new Parse.Query(Door).equalTo("readerin", reader).first();
                if (!door)
                    door = await new Parse.Query(Door).equalTo("readerout", reader).first();
                if (door)
                    o.set("door", door);               
            }
            let member = members.find(x => x.get("cardNumber") == r.card_no);
            if(!member)continue;
            o.set("member", member);
            objects.push(o);
             //save or update daily attendance
             let dailyAttendance = dailyAttendances.find(x=>x.get("dateOccurred")==r["date_occurred"] && x.get("cardNumber")==r["card_no"]);
             if(!dailyAttendance){
                 dailyAttendance = new DailyAttendance({
                            dateOccurred:r["date_occurred"], 
                            cardNumber:r["card_no"], attendanceEnd:o, 
                            attendanceStart:o, 
                            member:o.get("member")                            
                        });
                 dailyAttendances.push(dailyAttendance);
                 objects.push(dailyAttendance);
             }else{
                 //assume the data has been sorted
                 dailyAttendance.set("attendanceEnd", o);                 
                 objects.push(dailyAttendance);                    
             }
        }
        await ParseObject.saveAll(objects);
    }

    async saveCCureData(records:any[]){        
            let objects=[];
            
            
            
            let members = await new Parse.Query(LinearMember).select("cardNumber")
                                .limit(records.length)
                                .containedIn("cardNumber", records.map(x=>x.cardNumber.toString()))
                                .find();
            let updateTimes = records.map(x=>x["cardNumber"] + "");
            let cardNumbers = records.map(x=>{
                let dt = new Date(x["updateTime"]*1000);
                let correctDate = new Date(dt.getFullYear()+20,dt.getMonth(),dt.getDate(),dt.getHours(),dt.getMinutes(),dt.getSeconds())
                return moment(correctDate).format("YYYYMMDD");
            })

            let dailyAttendances = await new Parse.Query(DailyAttendance)
                                    .containedIn("dateOccurred", updateTimes)
                                    .containedIn("cardNumber", cardNumbers)
                                    .limit(records.length).find();
            console.log("members", members.length);
            let doors = await new Parse.Query(Door).limit(records.length)
                        .containedIn("doorname", records.map(x=>x["door"]))
                        .find();     
            // console.log("members", members);
            // console.log("doors", doors);
            for(let r of records) {
                let newData:any={};
                let dt = new Date(r["updateTime"]*1000);
                let correctDate = new Date(dt.getFullYear()+20,dt.getMonth(),dt.getDate(),dt.getHours(),dt.getMinutes(),dt.getSeconds());
                newData["rowguid"] = r["reportId"] + "";
                newData["date_occurred"] = moment(correctDate).format("YYYYMMDD") ;
                newData["time_occurred"] = moment(correctDate).format('HHmmss');
                newData["date_time_occurred"] =correctDate;
                newData["card_no"] = r["cardNumber"] + "";
                newData["point_no"] = r["doorId"] ;
                newData["point_name"] = r["door"];
                newData["message"] = r["message"];
                newData["system"] = 800;
                //make it similar to sipass
                newData["state_id"] = 2;
                newData["type"]=21;  

                let o = new AttendanceRecords(newData);            
                let member = members.find(x => x.get("cardNumber") == newData["card_no"]);
                if(!member)continue;                
                o.set("member", member);

                let door=doors.find(x=>x.get("doorname") == r.door);               
                if(!door)continue;
                o.set("door", door);
                
                objects.push(o);

                //save or update daily attendance
                let dailyAttendance = dailyAttendances.find(x=>x.get("dateOccurred")==newData["date_occurred"] && x.get("cardNumber")==newData["card_no"]);
                if(!dailyAttendance){
                    dailyAttendance = new DailyAttendance({
                        dateOccurred:newData["date_occurred"], 
                        cardNumber:newData["card_no"], 
                        attendanceEnd:o, 
                        attendanceStart:o,                    
                        member:o.get("member")
                    });
                    dailyAttendances.push(dailyAttendance);
                    objects.push(dailyAttendance);
                }else{
                    //assume the data has been sorted
                    dailyAttendance.set("attendanceEnd", o);
                    objects.push(dailyAttendance);                      
                }
            }
            //console.log("objects", objects.map(x=>ParseObject.toOutputJSON(x)))
            await ParseObject.saveAll(objects);
            //console.log("objects", objects.length);
           
        
    }
}

export default new AttendanceRecord();