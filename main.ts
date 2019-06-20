import { app } from 'core/main.gen';
import { Config } from 'core/config.gen';

import './custom/schedulers/index';
import './custom/shells/create-index';

import * as express from 'express';
app.use('/files', express.static(`${__dirname}/custom/files`));

import { ModBusService, ModbusDescriptions } from './custom/services/modbus-service/modbus-service';
import { ModbusHelper } from './custom/services/modbus-service/modbus-helper';


import {CCUREService} from './custom/modules/acs/CCURE'

let _service : CCUREService = new CCUREService();


_service.Login();

/*
_service.GetAllAccessReport().then((result)=>{
	console.log(result);
})

_service.GetPerson("personId=30853",(rows,ctx)=>{
	console.log(rows.length);
	console.log(rows);
});*/

_service.GetNewAccessReport().then((res)=>console.log(res));

_service.GetNameById("3404").then(res=>console.log("Result",res)).then(()=>{
	_service.GetNameById("3404").then(res=>console.log("Result",res));
});





