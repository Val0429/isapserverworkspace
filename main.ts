import { app } from 'core/main.gen';

import './custom/services/frs-service';
import './custom/schedulers/index';
import './custom/shells/create-index';

import * as express from 'express';
app.use('/files', express.static(`${__dirname}/custom/files`));

import { ModBusService, ModbusDescriptions, IModbusDeviceConfig } from './custom/services/modbus-service/modbus-service';
import { ModbusDeviceConfig } from './custom/models/modbus';
import { ModbusHelper } from './custom/services/modbus-service/modbus-helper';



var testFunc = (async () => {
    let result_read  = modbusClient.read(ModbusDescriptions.DO_Value,0,8,1000);
    let infos        = modbusClient.getDeviceInfo(1000);
    let result       = modbusClient.connect(1);

    let data = await Promise.all([result_read,infos]);

    console.log(data[0]);
    console.log(data[1]);

    modbusClient.disconnect();
});


let modbusClient : ModBusService;


ModbusHelper.LoadMoxaSystemConfig("E:/moxaConfig.txt",'utf-8').then((config)=>{

    modbusClient = new ModBusService(config);
    testFunc();

}).catch((e)=>{
    throw `LoadMoxaSystemConfig : ${e}`;
})







