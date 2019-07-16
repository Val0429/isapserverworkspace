import { Config } from 'core/config.gen';

import { Log } from 'helpers/utility';

import { ScheduleActionEmail } from 'core/scheduler-loader';
import { IAttendanceRecords, AttendanceRecords } from 'workspace/custom/models/index';

import * as mongo from 'mongodb';
import * as msSQL from 'mssql';

import * as delay from 'delay';

import { siPassAdapter, cCureAdapter } from './acsAdapter-Manager';
import { ParseObject } from 'core/cgi-package';
import moment = require('moment');


// import { CCUREReader } from './ccureReader'
// import { QueryContent } from './queryMap'
// import { SignalObject } from "./signalObject";


export class AttendanceRecord {
    private waitTimer = null;
    private startDelayTime: number = 1 // sec
    private cycleTime: number = 600; // sec

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
        const url = `mongodb://${Config.mongodb.ip}:${Config.mongodb.port}`;
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

                var end = now = new Date();
                var begin = new Date(new Date().setHours( end.getHours() - 1 ));

                let records = await siPassAdapter.getRecords(
                    begin.toISOString().slice(0,10).replace(/-/g,""),
                    ("0" + begin.getHours()).slice(-2),
                    ("0" + begin.getMinutes()).slice(-2),
                    ("0" + begin.getSeconds()).slice(-2),
                    ("0" + end.getHours()).slice(-2),
                    ("0" + end.getMinutes()).slice(-2),
                    ("0" + end.getSeconds()).slice(-2)
                );

                records.forEach( async (r) => {
                    let o = new AttendanceRecords(r);
                    await o.save();
                    await delay(100);
                });

                Log.Info(`${this.constructor.name}`, `2.0 Query Records from CCure800`);

                records = await cCureAdapter.getRecords();

                records.forEach( async (r) => {
                    r["rowguid"] = r["reportId"] + "";
                    r["date_occurred"] = moment(r["updateTime"]).format("YYYYMMDD") ;
                    r["time_occurred"] = moment(r["updateTime"]).format('HHmmss');
                    r["card_no"] = r["cardNum"] + "";
                    r["point_no"] = r["doorId"] + "";
                    r["point_name"] = r["doorName"];
                    r["category"] = r["messageCode"];

                    delete r["reportId"];
                    delete r["updateTime"];
                    delete r["cardNum"];
                    delete r["doorId"];
                    delete r["doorName"];
                    delete r["messageCode"];

                    let o = new AttendanceRecords(r);

                    await o.save();
                    await delay(100);
                });
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