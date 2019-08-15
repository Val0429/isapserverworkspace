import { app } from 'core/main.gen';
import './custom/schedulers/index';
import './custom/shells/create-index';
import * as express from 'express';
app.use('/files', express.static(`${__dirname}/custom/files`));
import {CCUREService} from './custom/modules/acs/CCURE'
import { GetMigrationDataPermissionTable, GetMigrationDataPerson, GetOldAccessReport } from './custom/modules/acs/CCURE/Migration';


function WriteJsonFile(path,json){
    const fs = require('fs');
    fs.writeFile(path, JSON.stringify(json), function (err) {
        if (err) {
            return console.log(err);
        }
        console.log("Save finish");
    });
}

/*
let _service : CCUREService = new CCUREService();
_service.Login();
_service.GetAllOrganizedDoorGroup().then(result=>WriteJsonFile("E://doorgroup.txt",result));
_service.GetAllOrganizedFloorGroup().then(result=>WriteJsonFile("E://floorgroup.txt",result));
_service.GetAllOrganizedElevatorGroup().then(result=>WriteJsonFile("E://elevatorgroup.txt",result));
_service.GetAllOrganizedElevatorFloor().then(result=>WriteJsonFile("E://test.txt",result));
*/



//Permission table
//GetMigrationDataPermissionTable().then(result => WriteJsonFile("E://permissionResult.txt",result));

//Person
//GetMigrationDataPerson("E:/person.csv");

//Old report
let counter = 0;
GetOldAccessReport({
    "server": "172.16.10.67",
    "port": 65062,
    "user": "sa",
    "password": "manager",
    "database": "FET_CHECK_SYSTEM",
    "connectionTimeout": 3000000,
},rows=>WriteJsonFile(`E://reportList/${counter++}.txt`,rows),new Date(2019,1,1,0,0,0,0),new Date(2019,1,2,0,0,0,0));









