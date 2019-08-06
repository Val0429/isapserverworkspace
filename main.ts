import { app } from 'core/main.gen';
import { Config } from 'core/config.gen';

import './custom/schedulers/index';
import './custom/shells/create-index';

import * as express from 'express';
app.use('/files', express.static(`${__dirname}/custom/files`));

import { ModBusService, ModbusDescriptions } from './custom/services/modbus-service/modbus-service';
import { ModbusHelper } from './custom/services/modbus-service/modbus-helper';

import {CCUREService} from './custom/modules/acs/CCURE'
import { GetMigrationDataPermissionTable, GetMigrationDataPerson } from './custom/modules/acs/CCURE/Migration';

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

//GetMigrationDataPermissionTable().then(r => WriteJsonFile("E://result.txt",r));
GetMigrationDataPerson().then(r => WriteJsonFile("E://result2.txt",r));







