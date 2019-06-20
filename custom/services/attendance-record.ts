import { Config } from 'core/config.gen';

import { Log } from 'helpers/utility';

import { ScheduleActionEmail } from 'core/scheduler-loader';
import { IAttendanceRecords, AttendanceRecords } from 'workspace/custom/models/index';

import * as mongo from 'mongodb';
import * as msSQL from 'mssql';

import * as delay from 'delay';

import { SiPassAdapter } from './acs/SiPass';


export class AttendanceRecord {
    private waitTimer = null;
    private startDelayTime: number = 1 // sec
    private cycleTime: number = 600; // sec

    private mongoClient: mongo.MongoClient;
    private mongoDb: mongo.Db;

    private sqlClient: msSQL.connection ;
    
    private adSiPass: SiPassAdapter;

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

        // if ((now.getHours() == 0) && (now.getMinutes() == 5)) {  // Startup @XX:05
        if (now.getMinutes() != 5) {
            // 0.0 Initial Adapter
            Log.Info(`${this.constructor.name}`, `0.0 Initial Adapter`);
            this.adSiPass = new SiPassAdapter();
        
            // 1.0 Login
            {
                Log.Info(`${this.constructor.name}`, `1.0 Login`);
                let sessionId = await this.adSiPass.Login();
            }
            await delay(1000);


            // 2.0 Query Records
            {
                Log.Info(`${this.constructor.name}`, `2.0 Query Records`);

                var end = now = new Date();
                var begin = new Date(now.setHours( now.getHours() - 1 ));
                
                console.log(begin, end);

                let records = await this.adSiPass.getRecords(
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