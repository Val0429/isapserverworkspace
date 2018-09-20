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
    let result = await modbusClient.connect(1);
    let result_write  = await modbusClient.write(ModbusDescriptions.DO_Value,0,[1,1,1,1]);
    let result_read  = await modbusClient.read(ModbusDescriptions.DO_Value,0,8);
    let infos = await modbusClient.getDeviceInfo();
    console.log(result_read);
    console.log(infos);
    modbusClient.disconnect();
});


let modbusClient : ModBusService;


ModbusHelper.LoadMoxaSystemConfig("E:/moxaConfig.txt",'utf-8').then((config)=>{
    modbusClient = new ModBusService(config);
    testFunc();
}).catch((e)=>{
    throw e;
})







