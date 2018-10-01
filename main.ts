import { app } from 'core/main.gen';

import './custom/services/frs-service';
import './custom/schedulers/index';
import './custom/shells/create-index';

import * as express from 'express';
app.use('/files', express.static(`${__dirname}/custom/files`));

import { ModBusService, ModbusDescriptions } from './custom/services/modbus-service/modbus-service';
import { ModbusHelper } from './custom/services/modbus-service/modbus-helper';

/*

//Read system config from file ( the system config is created by software<moxa search IO> which is download from their website)
ModbusHelper.LoadMoxaSystemConfig("E:/moxaConfig.txt",'utf-8').then(async (config)=>{
    try{
        //Init test const number and array
        const moxaTimeout : number = 2000; 
        const writeTestData : Array<number> = [0,0,1,1,0,0,1,0];

        //Create object and set config at the same time
        let modbusClient = new ModBusService(config);

        //Connect
        let result        = modbusClient.connect(1);

        //Get device informations
        let result_infos  = modbusClient.getDeviceInfo();

        //Write data to DO value
        let result_write1 = modbusClient.write(ModbusDescriptions.DO_Value, 0, writeTestData, moxaTimeout);

        //Read differenct index and length data
        let result_read1  = modbusClient.read(ModbusDescriptions.DO_Value);
        let result_read2  = modbusClient.read(ModbusDescriptions.DO_Value, 3);
        let result_read3  = modbusClient.read(ModbusDescriptions.DO_Value, 2, 4);

        //Wait
        let data          = await Promise.all([result_read1, result_read2, result_read3]);
        let infos         = await result_infos;

        //Print result log
        console.log(`\nMoxa device infomations`);
        console.log(infos);
        console.log(`\nMoxa DO_Value Data : `, writeTestData);
        console.log(`Read all           : `, data[0]);
        console.log(`Read index 3 to end:          `, data[1]);
        console.log(`Read index 2 to 5  :       `, data[2]);

        //Disconnect
        modbusClient.disconnect();

    }catch(e){
        throw `modbus-service error : ${e}`;
    }
}).catch((e)=>{
    throw `LoadMoxaSystemConfig : ${e}`;
})

*/
/*
import ast from 'services/ast-services/ast-client';
interface Test {
    prop1: string;
    prop2: number;
    prop3: TestEnum;
}
type PTest = Partial<Test>;
enum TestEnum {
    User,
    Guest,
    Visitor
}
(async () => {
    let testdata = {
        prop1: "123",
        prop2: 123,
        prop3: "Visitor"
    }
    try {
        let result = await ast.requestValidation("Test", testdata);
        console.log('result', result);
    } catch(e) {
        console.log(e);
    }
})();
*/