import { Log } from './log';

import { AttendanceRecords, Member, Reader, Door } from 'workspace/custom/models/index';

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
            //batch by 10.000 to prevent out of memory / stack
            while (records.length > 10000) {
                await this.saveCCureData(records.splice(0, 10000));
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
            //batch by 10.000 to prevent out of memory / stack
            while (records.length > 10000) {
                await this.saveSipassData(records.splice(0, 10000));
            }
            await this.saveSipassData(records);
        }catch(err){
            console.log("cannot get data from sipass", JSON.stringify(err));
        }
    }
    private async saveSipassData(records: any[]) {
        let objects = [];
        let members = await new Parse.Query(Member)
                        .select("Credentials")
                        .limit(records.length)
                        .containedIn("Credentials.CardNumber", records.filter(x => x.Credentials && x.Credentials.length > 0).map(x => x.Credentials[0].CardNumber))
                        .find();
        let readers = await new Parse.Query(Reader).limit(records.length)
            .containedIn("readername", records.map(x => x["point_name"]))
            .find();
        for (let r of records) {
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
            o.set("member", members.find(x => x.get("Credentials") && x.get("Credentials").length > 0 && x.get("Credentials")[0]["CardNumber"] == r.Credentials[0].CardNumber));
            objects.push(o);
            //important to avoid out of memory
            if (objects.length >= 1000) {
                await ParseObject.saveAll(objects);
                objects = [];
            }
        }
        await ParseObject.saveAll(objects);
        return objects;
    }

    async saveCCureData(records:any[]){        
            let objects=[];
            
            
            
            let members = await new Parse.Query(Member).select("Credentials")
                                .limit(records.length)
                                .containedIn("Credentials.CardNumber", records.map(x=>x.cardNumber.toString()))
                                .find();

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
                o.set("member", members.find(x=>x.get("Credentials") && x.get("Credentials").length>0 && x.get("Credentials")[0]["CardNumber"] == r.cardNumber));
                o.set("door", doors.find(x=>x.get("doorname") == r.door));
                objects.push(o);
                
                
            }
            //console.log("objects", objects.map(x=>ParseObject.toOutputJSON(x)))
            await ParseObject.saveAll(objects);
            //console.log("objects", objects.length);
           
        
    }
}

export default new AttendanceRecord();