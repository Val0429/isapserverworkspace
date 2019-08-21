import { Config } from 'core/config.gen';

import { Log } from './log';

import { ScheduleActionEmail } from 'core/scheduler-loader';
import { IAttendanceRecords, AttendanceRecords } from 'workspace/custom/models/index';

import * as mongo from 'mongodb';
import * as msSQL from 'mssql';

import * as delay from 'delay';

import { siPassAdapter, cCureAdapter } from './acsAdapter-Manager';
import { ParseObject } from 'core/cgi-package';
import moment = require('moment');
import { mongoDBUrl } from 'helpers/mongodb/url-helper';
import { CCUREService } from '../modules/acs/CCURE';


// import { CCUREReader } from './ccureReader'
// import { QueryContent } from './queryMap'
// import { SignalObject } from "./signalObject";


export class AttendanceRecord {
    private waitTimer = null;
    private startDelayTime: number = 1 // sec
    private cycleTime: number = 300; // sec

    private mongoClient: mongo.MongoClient;
    private mongoDb: mongo.Db;

    // CCure 800
    // private _reader: CCUREReader = null;
    // private _signal: SignalObject = null;


    constructor() {
        var me = this;

        // 1.0 Login to Datebase
        Log.Info(`${this.constructor.name}`, `1.0 Login database connection`);
        (async () => {
            await me.initialAdapterConnection();
        })();

        this.waitTimer = setTimeout(async () => {
            me.doAccessControlSync();
        }, 1000 * this.startDelayTime);
    }

    async initialAdapterConnection() {
        const url = mongoDBUrl();
        this.mongoClient = await mongo.MongoClient.connect(url);
        this.mongoDb = await this.mongoClient.db(Config.mongodb.collection);
    }

    async doAccessControlSync() {
        Log.Info(`${this.constructor.name}`, `2.0 Timer Check`);

        var me = this;
        let now: Date = new Date();

        clearTimeout(this.waitTimer);

        if (now.getMinutes() == 5) {  // Startup @XX:05
        // if (now.getMinutes() != 70) {
            // 0.0 Initial Adapter
            Log.Info(`${this.constructor.name}`, `0.0 Initial Adapter`);

            // 2.0 Query Records
            {
                Log.Info(`${this.constructor.name}`, `2.0 Query Records from SiPass`);
                let objects=[];
                var end = now = new Date();
                var begin = new Date(new Date().setHours( end.getHours() - 1 ));

                let records = [];
                try{                    
                    records = await siPassAdapter.getRecords(
                        begin.toISOString().slice(0,10).replace(/-/g,""),
                        ("0" + begin.getHours()).slice(-2),
                        ("0" + begin.getMinutes()).slice(-2),
                        ("0" + begin.getSeconds()).slice(-2),
                        ("0" + end.getHours()).slice(-2),
                        ("0" + end.getMinutes()).slice(-2),
                        ("0" + end.getSeconds()).slice(-2)
                    );
                }catch(err){
                    console.error("cannot get data from sipass", err);
                    records=[];
                }

                for(let r of records){
                    let dateTime = r["date_occurred"] + r["time_occurred"];
                    r["date_time_occurred"] = moment(dateTime, 'YYYYMMDDHHmmss').toDate();

                    let o = new AttendanceRecords(r);
                    objects.push(o);
                    //important to avoid out of memory
                    if(objects.length>=1000){
                        await ParseObject.saveAll(objects);
                        objects=[];
                    }
                }
                await ParseObject.saveAll(objects);
                objects=[];
                Log.Info(`${this.constructor.name}`, `2.0 Query Records from CCure800`);
                try{
                    let ccureService = new CCUREService();
                    await ccureService.Login();
                    records = await ccureService.GetOrganizedNewReport();
                }catch(err){
                    console.error("cannot get data from ccure", err);
                    records=[];
                }
                
                

                for(let r of records) {
                    let newData:any={};
                    let dt = new Date(r["updateTime"]);
                    newData["rowguid"] = r["reportId"] + "";
                    newData["date_occurred"] = moment(dt).format("YYYYMMDD") ;
                    newData["time_occurred"] = moment(dt).format('HHmmss');
                    newData["date_time_occurred"] =dt;
                    newData["card_no"] = r["cardNumber"] + "";
                    newData["point_no"] = r["doorId"] + "";
                    newData["point_name"] = r["door"];
                    newData["message"] = r["message"];
                    
                    //make it similar to sipass
                    newData["state_id"] = 2;
                    newData["type"]=21;                   

                    let o = new AttendanceRecords(newData);

                    objects.push(o);
                    //important to avoid out of memory
                    if(objects.length>=1000){
                        await ParseObject.saveAll(objects);
                        objects=[];
                    }
                }
                await ParseObject.saveAll(objects);
            }
            await delay(1000);
        }

        now = new Date();
        var s = (now.getMinutes() * 60 + now.getSeconds()) % this.cycleTime;
        Log.Info(`${this.constructor.name}`, `Timer Check wait for [ ${this.cycleTime - s} ] sec`);

        this.waitTimer = setTimeout(() => {
            this.doAccessControlSync();
        }, (this.cycleTime - s) * 1000);
    } 
}

export default new AttendanceRecord();