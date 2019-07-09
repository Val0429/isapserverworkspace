import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors, Cameras, ICameras,
    Restful, FileHelper, ParseObject
} from 'core/cgi-package';

import { Log } from 'helpers/utility';
import { siPassAdapter, cCureAdapter } from '../../custom/services/acsAdapter-Manager';
import * as delay from 'delay';
import { Reader, Floor, Door } from '../../custom/models'

var action = new Action({
    loginRequired: true,
    // permission: [RoleList.Admin, RoleList.SuperAdministrator, RoleList.SystemAdministrator],
    // apiToken: "3-1_door_accesslevel_CRUD"
});

/********************************
 * R: get object
 ********************************/
type InputR = Restful.InputR<any>;
type OutputR = Restful.OutputR<any>;

action.get<InputR, OutputR>({ inputType: "InputR" }, async () => {
    let now: Date = new Date();

    let siPassSessionId = siPassAdapter.sessionToken;
    Log.Info(`${this.constructor.name}`, ` SiPass SessionToken ${siPassSessionId}`);
    Log.Info(`${this.constructor.name}`, ` getHours ${now.getHours()} getMinutes ${now.getMinutes()}`);

    let obj: any;
    if (siPassSessionId != "") {
        Log.Info(`${this.constructor.name}`, `SiPass 2.3 Door Readers`);
        {
            let records = await siPassAdapter.getReaders();
            console.log("Readers", records);

            if (records) {
                for (let idx = 0; idx < records.length; idx++) {
                    const r = records[idx];

                    Log.Info(`${this.constructor.name}`, `Import data SiPass Reader ${r["Name"]}-${r["Token"]}`);

                    obj = await new Parse.Query(Reader).equalTo("readerid", r["Token"]).first();
                    if (obj == null) {
                        let d = {
                            system: 1,
                            readerid: r["Token"],
                            readername: r["Name"],
                            status: 1
                        };

                        let o = new Reader(d);
                        await o.save();
                    }
                    else {
                        obj.set("system", 1);
                        obj.set("readerid", r["Token"]);
                        obj.set("readername", r["Name"]);

                        obj.save();
                    }
                    // await this.mongoDb.collection("Reader").findOneAndUpdate({ "readerid": r["Token"] }, { $set: d }, { upsert: true });
                };
            }
        }
        await delay(1000);

        Log.Info(`${this.constructor.name}`, `SiPass 2.5 Floors`);
        {
            let records = await siPassAdapter.getFloors();
            console.log("Floors", records);

            if (records) {
                for (let idx = 0; idx < records.length; idx++) {
                    const r = records[idx];

                    Log.Info(`${this.constructor.name}`, `Import data SiPass FloorPoints ${r["Name"]}-${r["Token"]}`);

                    obj = await new Parse.Query(Floor).equalTo("floorid", r["Token"]).first();

                    if (obj == null) {
                        let d = {
                            system: 1,
                            floorid: r["Token"],
                            floorname: r["Name"],
                            status: 1
                        };
                        let o = new Floor(d);
                        let o1 = await o.save();
                    }
                    else {
                        obj.set("system", 1);
                        obj.set("floorid", r["Token"]);
                        obj.set("floorname", r["Name"]);
                        obj.save();
                    }
                    // await this.mongoDb.collection("Floor").findOneAndUpdate({ "floorid": r["Token"] }, { $set: d }, { upsert: true });
                }
            }
        }
        await delay(1000);
    }

    // 3.0 get data from CCure800
    {
        Log.Info(`${this.constructor.name}`, `CCure 2.5 Door Readers`);
        {
            let records = await cCureAdapter.getReaders();
            console.log("Readers", records);

            if (records) {
                for (let idx = 0; idx < records.length; idx++) {
                    const r = records[idx];

                    Log.Info(`${this.constructor.name}`, `Import data CCURE800 Readers ${r["deviceName"]}-${r["deviceId"]}`);

                    obj = await new Parse.Query(Reader).equalTo("readerid", r["deviceId"]).first();
                    if (obj == null) {
                        let d = {
                            system: 1,
                            readerid: r["deviceId"],
                            readername: r["deviceName"],
                            status: 1
                        };

                        obj = new Reader(d);
                        await obj.save();
                    }
                    else {
                        obj.set("readerid", r["deviceId"]);
                        obj.set("readername", r["deviceName"]);

                        obj.save();
                    }

                    let door = await new Parse.Query(Door).equalTo("doorid", +r["doorId"]).first();
                    if (door) {
                        let readers = door.get("readerin");
                        readers.push(obj);
                        door.set("readerin", readers);
                    }
                };
            }
        }
        await delay(1000);

        Log.Info(`${this.constructor.name}`, `CCure 2.6 Floors`);
        {
            let records = await cCureAdapter.getFloors();
            console.log("Floors", records);

            if (records) {
                for (let idx = 0; idx < records.length; idx++) {
                    const r = records[idx];

                    Log.Info(`${this.constructor.name}`, `Import data CCURE800 Floors ${r["floorName"]}-${r["floorId"]}`);

                    obj = await new Parse.Query(Floor).equalTo("floorid", r["Token"]).first();

                    if (obj == null) {
                        let d = {
                            system: 1,
                            floorid: r["floorId"],
                            floorname: r["floorName"],
                            status: 1
                        };
                        let o = new Floor(d);
                        let o1 = await o.save();
                    }
                    else {
                        obj.set("floorid", r["floorId"]);
                        obj.set("floorname", r["floorName"]);
                        obj.save();
                    }
                    // await this.mongoDb.collection("Floor").findOneAndUpdate({ "floorid": r["Token"] }, { $set: d }, { upsert: true });
                }
            }
        }
        await delay(1000);
    }

    return null;
});

export default action;
