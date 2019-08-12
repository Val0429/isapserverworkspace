import { app } from 'core/main.gen';
import { Config } from 'core/config.gen';

import './custom/schedulers/index';
import './custom/shells/create-index';

import * as express from 'express';
app.use('/files', express.static(`${__dirname}/custom/files`));

import { ModBusService, ModbusDescriptions } from './custom/services/modbus-service/modbus-service';
import { ModbusHelper } from './custom/services/modbus-service/modbus-helper';

import {CCUREService} from './custom/modules/acs/CCURE'
import { GetMigrationDataPermissionTable, GetMigrationDataPerson, GetOldAccessReport } from './custom/modules/acs/CCURE/Migration';

let _service : CCUREService = new CCUREService();

function WriteJsonFile(path,json){
    const fs = require('fs');
    fs.writeFile(path, JSON.stringify(json), function (err) {
        if (err) {
            return console.log(err);
        }
        console.log("Save finish");
    });
}
let counter = 0;
GetMigrationDataPermissionTable().then(result => WriteJsonFile("E://permissionResult.txt",result));
GetMigrationDataPerson("E:/person.csv");
GetOldAccessReport({
    "server": "172.16.10.67",
    "port": 65062,
    "user": "sa",
    "password": "manager",
    "database": "FET_CHECK_SYSTEM",
    "connectionTimeout": 15000,
},rows=>WriteJsonFile(`E://reportList/${counter++}.txt`,rows),new Date(2019,1,1,0,0,0,0),new Date(2019,2,1,0,0,0,0));







