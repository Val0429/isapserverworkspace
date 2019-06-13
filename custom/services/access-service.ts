import { Config } from 'core/config.gen';

import { Log } from 'helpers/utility';

import { ScheduleActionEmail } from 'core/scheduler-loader';

import * as mongo from 'mongodb';

// import { SiPassAccountService } from './../modules/acs/sipass';


export class AccessControlRecordService {
    private waitTimer = null;
    private startDelayTime: number = 1 // sec
    private cycleTime: number = 600; // sec

    private client: mongo.MongoClient ;
    private db: mongo.Db;

    // private siPassDevice: SiPassAccountService;

    constructor() {
        var me = this;

        // this.siPassDevice = new SiPassAccountService();

        this.waitTimer = setTimeout(() => {
            me.doAccessControlRecordSync();
        }, 1000 * this.startDelayTime ) ;
    }

    async doAccessControlRecordSync() {
        Log.Info(`${this.constructor.name}`, `2.0 Timer Check`);

        var me = this;        
        let now: Date = new Date();

        clearTimeout(this.waitTimer);

        // if ((now.getHours() == 0) && (now.getMinutes() == 0)) {
        if ((now.getHours() != 0)) {            
            // 1.0 create database connection
            Log.Info(`${this.constructor.name}`, `2.0 create database connection`);
            // (async () => {
                const url = `mongodb://${Config.mongodb.ip}:${Config.mongodb.port}`;
                this.client = await mongo.MongoClient.connect(url);
                this.db = await this.client.db(Config.mongodb.collection);
            // })();

            


            // 6.0 report log and send smtp 
            Log.Info(`${this.constructor.name}`, `6.0 report log and send smtp`);
            // let file = new Parse.File("snapshot.jpg", { base64: item["attachments"]}, "image/jpg" );
            // await file.save();

            let result = await new ScheduleActionEmail().do(
            {
                to: ["tulip.lin@isapsolution.com"],
                subject: "subject",
                body: "body",
                // attachments: [file]
            });


            // 7.0 Database disconnect
            this.client.close();
        }

        now = new Date();
        var s = (now.getMinutes() * 60 + now.getSeconds()) % this.cycleTime;
        Log.Info(`${this.constructor.name}`, `Timer Check wait for [ ${this.cycleTime - s} ] sec`);

        this.waitTimer = setTimeout(() => {
            this.doAccessControlRecordSync();
        }, (this.cycleTime - s) * 1000);
    }
}

export default new AccessControlRecordService();