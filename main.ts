import { app } from 'core/main.gen';

import './custom/services/frs-service';
import './custom/schedulers/index';
import './custom/shells/create-index';

import * as express from 'express';
app.use('/files', express.static(`${__dirname}/custom/files`));

import { ModBusService, ModbusDescriptions } from './custom/services/modbus-service/modbus-service';
import { ModbusHelper } from './custom/services/modbus-service/modbus-helper';

const moxaTimeout : number = 1000; 

var TestFuncSet = (async () => {

    modbusClient.connect(1);
    let infos         = modbusClient.getDeviceInfo(moxaTimeout);
    let result_read1  = modbusClient.read(ModbusDescriptions.DI_Value);
    let result_read2  = modbusClient.read(ModbusDescriptions.DO_Value);
    let result_read3  = modbusClient.read(ModbusDescriptions.DO_Pulse_Status);

    let data          = await Promise.all([infos,result_read1, result_read2,result_read3]);
    modbusClient.disconnect();

    console.log(data[0]);
    console.log(data[1]);
    console.log(data[2]);
    console.log(data[3]);

});

let modbusClient : ModBusService;

ModbusHelper.LoadMoxaSystemConfig("E:/moxaConfig.txt",'utf-8').then((config)=>{

    modbusClient = new ModBusService(config);
    TestFuncSet();

}).catch((e)=>{
    throw `LoadMoxaSystemConfig : ${e}`;
})







