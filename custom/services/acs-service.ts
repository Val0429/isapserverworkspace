import { Config } from 'core/config.gen';

import { Log } from 'helpers/utility';

import { ScheduleActionEmail } from 'core/scheduler-loader';

import * as mongo from 'mongodb';
// import * as msSQL from 'mssql';

// import { SiPassAccountService } from './../modules/acs/sipass';


export class ACSService {
    private waitTimer = null;
    private startDelayTime: number = 1 // sec
    private cycleTime: number = 600; // sec

    private mongoClient: mongo.MongoClient;
    private mongoDb: mongo.Db;

    constructor() {
        var me = this;

        this.waitTimer = setTimeout(() => {
            me.doAccessControlSync();
        }, 1000 * this.startDelayTime);
    }

    async doAccessControlSync() {
        Log.Info(`${this.constructor.name}`, `2.0 Timer Check`);

        var me = this;
        let now: Date = new Date();

        clearTimeout(this.waitTimer);

        if (now.getMinutes() == 0) {
            // 1.0 create database connection
            Log.Info(`${this.constructor.name}`, `2.1 create mongo database connection`);
            // (async () => {
            const url = `mongodb://${Config.mongodb.ip}:${Config.mongodb.port}`;
            this.mongoClient = await mongo.MongoClient.connect(url);
            this.mongoDb = await this.mongoClient.db(Config.mongodb.collection);
            // })();

            // door reader
            // door group
            // time table
            // card no
            // card holder
            // permission
            // access event
            // access record

            // 2.0 get date from SiPass


            // 3.0 get data from CCure800




            // 4.0 report log and send smtp 
            Log.Info(`${this.constructor.name}`, `4.0 report log and send smtp`);
            // let file = new Parse.File("snapshot.jpg", { base64: item["attachments"]}, "image/jpg" );
            // await file.save();

            // let result = await new ScheduleActionEmail().do(
            //     {
            //         to: ["tulip.lin@isapsolution.com"],
            //         subject: "subject",
            //         body: "body",
            //         // attachments: [file]
            //     });

            // 7.0 Database disconnect
            this.mongoClient.close();
        }

        now = new Date();
        var s = (now.getMinutes() * 60 + now.getSeconds()) % this.cycleTime;
        Log.Info(`${this.constructor.name}`, `Timer Check wait for [ ${this.cycleTime - s} ] sec`);

        this.waitTimer = setTimeout(() => {
            this.doAccessControlSync();
        }, (this.cycleTime - s) * 1000);
    }
}

export default new ACSService();