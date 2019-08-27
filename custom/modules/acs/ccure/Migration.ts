import { CCUREService } from "./../CCURE"
import { ReportReader, ReaderQueryContent, ReaderQueryMap } from "./../CCURE/ReportReader"

import { delay } from "bluebird";
import { isNullOrUndefined } from "util";
import { SignalObject } from "./signalObject";

function NormalizeJSON(obj) {
    Object.keys(obj).forEach(function (k) {
        if (isNullOrUndefined(obj[k].length) == true) {
            let arr = []
            arr.push(obj[k]);
            obj[k] = arr;
        }
    });
}

function GetKeyMap(jsons: JSON[], keyIDName: string, valueName: string): Map<number, string> {
    let result = new Map();
    for (var i = 0; i < jsons.length; i++) {
        result[jsons[i][keyIDName]] = jsons[i][valueName];
    }
    return result;
}

function WriteJsonFile(path, json) {
    const fs = require('fs');
    fs.writeFile(path, JSON.stringify(json), function (err) {
        if (err) {
            return console.log(err);
        }
        console.log("Save finish");
    });
}



export async function GetMigrationDataPermissionTable() {

    console.log("=====Start GetMigrationDataPermissionTable=====");

    let _service: CCUREService = new CCUREService();

    _service.Login();

    await delay(3000);

    let permTables = await _service.GetAllPermissionTables();
    let doors = await _service.GetAllDoors();
    let doorGroups = await _service.GetAllDoorGroup();
    let permTableDoor = await _service.GetAllPermissionTableDoor();
    let permTableDoorGroup = await _service.GetAllPermissionTableDoorGroup();
    let timeSchedules = await _service.GetAllTimeSchedules();
    let groupMember = await _service.GetAllGroupMember();
    let elevatorGroups = await _service.GetAllElevatorGroup();
    let floorGroups = await _service.GetAllFloorGroup();

    let elevators = await _service.GetAllElevators();
    let floors = await _service.GetAllFloors();
    let devices = await _service.GetAllDevices();
    let permTableEvevatorFloor = await _service.GetAllPermissionTableElevatorFloor();


    let permTablesKeyMap = GetKeyMap(permTables, "permissionTableId", "permissionTableName");
    let timeSchedulesKeyMap = GetKeyMap(timeSchedules, "timespecId", "timespecName");
    let doorKeyMap = GetKeyMap(doors, "doorId", "doorName");
    let doorGroupKeyMap = GetKeyMap(doorGroups, "groupId", "groupName");
    let floorsKeyMap = GetKeyMap(floors, "floorId", "floorName");
    let devicesKeyMap = GetKeyMap(devices, "deviceId", "deviceName");
    let elevatorGroupsKeyMap = GetKeyMap(elevatorGroups, "groupId", "groupName");
    let floorGroupsKeyMap = GetKeyMap(floorGroups, "groupId", "groupName");


    var jsonata = require("jsonata");
    let permtableDoorGroupby: JSON = await jsonata("{$string(`permissionTableId`): $ }").evaluate(permTableDoor);
    let permtableDoorGroupGroupby: JSON = await jsonata("{$string(`permissionTableId`): $ }").evaluate(permTableDoorGroup);
    let permTableEvevatorFloorGroupby: JSON = await jsonata("{$string(`permissionTableId`): $ }").evaluate(permTableEvevatorFloor);
    let groupMemberGroupby: JSON = await jsonata("{$string(`groupId`): $ }").evaluate(groupMember);
    let devicesGroupby: JSON = await jsonata("{$string(`doorId`): $ }").evaluate(devices);
    let elevatorsGroupby: JSON = await jsonata("{$string(`elevatorId`): $ }").evaluate(elevators);
    let floorsGroupby: JSON = await jsonata("{$string(`floorId`): $ }").evaluate(floors);

    NormalizeJSON(permtableDoorGroupby);
    NormalizeJSON(permtableDoorGroupGroupby);
    NormalizeJSON(permTableEvevatorFloorGroupby);
    NormalizeJSON(devicesGroupby);
    NormalizeJSON(groupMemberGroupby);
    NormalizeJSON(elevatorsGroupby);
    NormalizeJSON(floorsGroupby);

    let result = {};

    //1. Initial Permission Table
    Object.keys(permTablesKeyMap).forEach(function (k) {
        result[permTablesKeyMap[k]] = [];
    });

    //2. Add door 
    function pushDoor(json, perId, timespecId, doorId, devices) {
        json[permTablesKeyMap[perId]].push(
            {
                "type": "door",
                "name": doorKeyMap[doorId],
                "devices": devices,
                "timespec": timeSchedulesKeyMap[timespecId],
            });
    }

    Object.keys(permtableDoorGroupby).forEach(function (permissionTableId) {
        let permIdjsonArr = permtableDoorGroupby[permissionTableId];
        for (var i = 0; i < permIdjsonArr.length; i++) {
            let doorId = permIdjsonArr[i]["doorId"];
            if (!devicesGroupby[doorId]) continue;//////
            let devices = [];
            for (var j = 0; j < devicesGroupby[doorId].length; j++) {
                devices.push(
                    {
                        "name": devicesGroupby[doorId][j]["deviceName"] ? devicesGroupby[doorId][j]["deviceName"].replace(/\r\n|\n|\r/g, ""):"",
                        "inOut": devicesGroupby[doorId][j]["inOut"]
                    }
                );
            }
            pushDoor(result, permissionTableId, permIdjsonArr[i]["timespecId"], doorId, devices);
        }
    });

    //3. Add door group
    function pushGroup(json, perId, timespecId, doorGroupId, doorDevices) {
        json[permTablesKeyMap[perId]].push(
            {
                "type": "doorGroup",
                "name": doorGroupKeyMap[doorGroupId],
                "doors": doorDevices,
                "timespec": timeSchedulesKeyMap[timespecId],
            });
    }
    Object.keys(permtableDoorGroupGroupby).forEach(function (permissionTableId) {
        let permIdjsonArr = permtableDoorGroupGroupby[permissionTableId];
        for (var i = 0; i < permIdjsonArr.length; i++) {
            let groupId: string = permIdjsonArr[i]["groupId"];
            if (!groupMemberGroupby[groupId]) continue;
            let doorDevices = [];
            for (var j = 0; j < groupMemberGroupby[groupId].length; j++) {
                let doorId = groupMemberGroupby[groupId][j]["objectId"];
                if (!devicesGroupby[doorId]) continue;
                let devicesJson = [];
                for (var n = 0; n < devicesGroupby[doorId].length; n++) {
                    devicesJson.push(
                        {
                            "name":devicesGroupby[doorId][n]["deviceName"]?devicesGroupby[doorId][n]["deviceName"].replace(/\r\n|\n|\r/g, ""):"",
                            "inOut":devicesGroupby[doorId][n]["inOut"]
                        }
                    );
                }
                doorDevices.push(
                    {
                        "type": "door",
                        "name": doorKeyMap[doorId],
                        "devices": devicesJson
                    }
                );
            }
            pushGroup(result, permissionTableId, permIdjsonArr[i]["timespecId"], groupId, doorDevices)
        }
    });

    //4. Add floor 
    function pushElevatorFloor(json, perId, timespecId, elevatorJson, floorJson) {
        json[permTablesKeyMap[perId]].push
            (
                {
                    "type": "elevatorFloor",
                    "elevator": elevatorJson,
                    "floor": floorJson,
                    "timespec": timeSchedulesKeyMap[timespecId]
                }
            );
    }
    Object.keys(permTableEvevatorFloorGroupby).forEach(function (permissionTableId) {
        let permIdjsonArr = permTableEvevatorFloorGroupby[permissionTableId];

        for (var i = 0; i < permIdjsonArr.length; i++) {
            // 4.1 Check Elevator or Elevator Group
            let elevatorOrGroupId = permIdjsonArr[i]["elevatorOrGroupId"];
            let elevatorJson;

            // 4.1.1 Check Elevator
            if (isNullOrUndefined(elevatorsGroupby[elevatorOrGroupId]) == false) {
                let elevatorId = elevatorOrGroupId;
                let deviceId = elevatorsGroupby[elevatorId][0]["deviceId"];
                elevatorJson =
                    {
                        "type": "elevator",
                        "name": elevatorsGroupby[elevatorId][0]["elevatorName"],
                        "device": devicesKeyMap[deviceId]?devicesKeyMap[deviceId].replace(/\r\n|\n|\r/g, ""):""
                    }
            }
            // 4.1.2 Check Group
            else {
                let groupId = elevatorOrGroupId;
                if (groupMemberGroupby[groupId]){
                    let tempJson = [];
                    for (var j = 0; j < groupMemberGroupby[groupId].length; j++) {
                        let elevatorId = groupMemberGroupby[groupId][j]["objectId"];
                        let deviceId = elevatorsGroupby[elevatorId]["deviceId"];
                        tempJson.push
                            (
                                {
                                    "type": "elevator",
                                    "name": elevatorsGroupby[elevatorId]["elevatorName"],
                                    "device": devicesKeyMap[deviceId]?devicesKeyMap[deviceId].replace(/\r\n|\n|\r/g, ""):""
                                }
                            );
                    }
                    elevatorJson =
                        {
                            "type": "elevatorGroup",
                            "name": elevatorGroupsKeyMap[groupId],
                            "elevators": tempJson
                        };
                }
            }

            // 4.2 Check Floor or Floor Group
            let floorOrGroupId = permIdjsonArr[i]["floorOrGroupId"];
            let floorJson;

            // 4.2.1 Check Floor
            if (isNullOrUndefined(floorsGroupby[floorOrGroupId]) == false) {
                let floorId = floorOrGroupId;
                floorJson =
                    {
                        "type": "floor",
                        "name": floorsGroupby[floorId][0]["floorName"]
                    }
            }
            // 4.2.2 Check Group
            else {
                let groupId = floorOrGroupId;
                if (!groupMemberGroupby[groupId]) continue;
                let tempJson = [];
                for (var j = 0; j < groupMemberGroupby[groupId].length; j++) {
                    let floorId = groupMemberGroupby[groupId][j]["objectId"];
                    tempJson.push
                        (
                            {
                                "type": "floor",
                                "name": floorsKeyMap[floorId],
                            }
                        );
                }
                floorJson =
                    {
                        "type": "floorGroup",
                        "name": floorGroupsKeyMap[groupId],
                        "floors": tempJson
                    };
            }

            //4.3 Push
            pushElevatorFloor(result, permissionTableId, permIdjsonArr[i]["timespecId"], elevatorJson, floorJson);
        }
    });

    console.log("=====Finish GetMigrationDataPermissionTable=====");

    return result;
}

export async function GetMigrationDataPerson(csvPath: string) {
    console.log("=====Start GetMigrationDataPerson=====");

    let signal = new SignalObject(false);
    const csv = require('csvtojson');
    let result;
    csv().fromFile(csvPath).then((jsonObj) => {
        result = jsonObj;
        signal.set(true);
    });
    await signal.wait();

    console.log("=====Finish GetMigrationDataPerson=====");

    return result;
}

export async function GetMigrationDataPersonWithImage(csvPath: string, folderPath : string, batchCount : number, OnRows : (rows: JSON[])=>void) {
    console.log("=====Start GetMigrationDataPerson=====");

    let signal = new SignalObject(false);
    const csv = require('csvtojson');
    let idMap = new Map();

    const fs = require('fs');
    await fs.readdir(folderPath, (err, fileList) => {
        if(err) throw err;
        fileList.forEach((fileName,err) => {
            let dotPos = fileName.indexOf('.');
            let len = fileName.length;
            let pId = fileName.substring(0,dotPos);
            let ext = fileName.substring(dotPos + 1,len);
            if(ext.toLowerCase() != "jpg" || isNaN(pId) == true) return;
            idMap[pId]=`${folderPath}${fileName}`;
        });
        signal.set(true);
    });

    await signal.wait();

    console.log("=====Get ID <--> Image file path link map=====");
    let totalData = 0;
    let hasImage = 0;

    signal.set(false);

    csv().fromFile(csvPath).then((jsonObj) => {
        let result = [];
        let bCount = 1;
        jsonObj.forEach(r => {
            let tempResult = JSON.parse(JSON.stringify(r));
            try{
                if(isNullOrUndefined(idMap[r["Person_ID"]]) == false){
                    let data = fs.readFileSync(`${idMap[r["Person_ID"]]}`);
                    let base64Image = new Buffer(data, 'binary').toString('base64');
                    tempResult["img"]= base64Image;
                    hasImage++;
                }
            }
            catch(err){
                throw err;
            }
            finally{
                totalData++;
                result.push(tempResult);
                if(bCount++ >= batchCount){
                    console.log(`GetMigrationDataPersonWithImage : Call Batch || Finish : ${(100*(totalData)/jsonObj.length).toFixed(2)} %`);
                    OnRows(result);
                    bCount=1;
                    result = [];
                }
            }
        });
        OnRows(Array.from(result));
        signal.set(true);
    });
    await signal.wait();
    console.log(`=====Person : ${totalData} || Has Image : ${hasImage}=====`);
    console.log("=====Finish GetMigrationDataPerson=====");

}


export async function GetOldAccessReport(config, onRaw: (rows: JSON[]) => void, startDatetime: Date, endDatetime: Date) {

    console.log("=====Start GetOldAccessReport=====");

    let _reader: ReportReader = ReportReader.getInstance();
    await _reader.connectAsync(config);
    await delay(3000);

    let persons = await _reader.queryAllAsync(ReaderQueryContent.Person, null, false, 180000);
    let doors = await _reader.queryAllAsync(ReaderQueryContent.Door, null, false, 180000);
    let personsKeyMap = GetKeyMap(persons, "personId", "name");
    let doorsKeyMap = GetKeyMap(doors, "doorId", "name");

    let onRawCallback = rows => {
        let result = [];
        for (var i = 0; i < rows.length; i++) {
            result.push({
                "dateTime": rows[i]["dateTime"],
                "person": personsKeyMap[rows[i]["personId"]],
                "cardNumber": rows[i]["cardNumber"],
                "door": doorsKeyMap[rows[i]["doorId"]]
            });
        }
        onRaw(result);
    }

    let DateTimeStringFormater = dt =>{
        return `${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()} ${dt.getHours()}:${dt.getMinutes()}:${dt.getSeconds()}`;
    }

    let startTimestring: string = DateTimeStringFormater(startDatetime);
    let endTimestring: string = DateTimeStringFormater(endDatetime);
    
    _reader.queryStreamAsync(
        ReaderQueryContent.Reports,
        onRawCallback,
        done => console.log(`=====GetOldAccessReport===== \ncount :${done["rowsAffected"]} \n=====Finish GetOldAccessReport=====`),
        null,
        `R_Date_Time BETWEEN '${startTimestring}' and '${endTimestring}'`,
        false);
}

export async function GetPersonImages(folderPath : string, batchCount : number, OnRows : (rows: JSON[])=>void){
    const folder = folderPath;
    const fs = require('fs');
    
    let count = 1;
    let batch = 1;
    let calltimes = 1;

    await fs.readdir(folder, (err, fileList) => {

        if(err) throw err;

        let result = [];
        
        fileList.forEach((fileName,err) => {
            
            let dotPos = fileName.indexOf('.');
            let len = fileName.length;
            let pId = fileName.substring(0,dotPos);
            let ext = fileName.substring(dotPos + 1,len);

            ++count;

            if(ext.toLowerCase() != "jpg" || isNaN(pId) == true) return;

            try{
                let data = fs.readFileSync(`${folder}${fileName}`);
                let base64Image = new Buffer(data, 'binary').toString('base64');
                result.push({
                    "personId" : pId,
                    "img":base64Image
                });
            }
            catch(err){
                throw err;
            }

            console.info(
                `Total read photo % : ${(100*(count)/fileList.length).toFixed(2)} || Batch (${calltimes}) read photo % : ${(100*++batch/batchCount).toFixed(2)}`
            );

            if(batch >= batchCount){
                calltimes++;
                batch = 1;
                let rows = Array.from(result);
                OnRows(rows);
                result = [];
            }
        });

        console.info(
            `Total read photo % : ${(100*(count)/fileList.length).toFixed(2)} || Batch (${calltimes}) read photo % : ${(100*++batch/batchCount).toFixed(2)}`
        );

        OnRows(result);
    });
}
