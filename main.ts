import { app } from 'core/main.gen';

import './custom/services/frs-service';
import './custom/schedulers/index';
import './custom/shells/create-index';

import * as express from 'express';
app.use('/files', express.static(`${__dirname}/custom/files`));

// app.use('/snapshot', express.static(`${__dirname}/custom/files/snapshots`));

import { ModBusService, IModBusConfig, IModBusRead, ModbusDescriptions, ModBusCodeType, IModBusWrite } from './custom/services/modbus-service/modbus-service';


let config : IModBusConfig = {
    "address"   : "192.168.127.254",
    "id"        : 1
}

let readConfig : IModBusRead = {
    "desc"      : ModbusDescriptions.Address_Mode ,
    "code"      : ModBusCodeType.Holding_Register ,
    "index"     : 0                               ,
    "length"    : 1                          
}
let writeConfig : IModBusWrite = {
    "desc"      : ModbusDescriptions.DO_Value,
    "code"      : ModBusCodeType.Coil_Status ,
    "index"     : 1                          ,
    "val"       : [+true,+true,+true]                       
}
var modbusClient = new ModBusService(config);

(async () => {
    let result = await modbusClient.connect();
    //let result_write = await modbusClient.write(writeConfig);
    let result_read  = await modbusClient.read(readConfig);
    let infos = await modbusClient.getDeviceInfo();
    console.log(result_read);
    console.log(infos);
    modbusClient.disconnect();
})();