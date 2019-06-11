import { app } from 'core/main.gen';

import './custom/schedulers/index';
import './custom/shells/create-index';

import * as express from 'express';
app.use('/files', express.static(`${__dirname}/custom/files`));

import { ModBusService, ModbusDescriptions } from './custom/services/modbus-service/modbus-service';
import { ModbusHelper } from './custom/services/modbus-service/modbus-helper';



import { CCUREReader, ICCUREConfig, IDSNList, QueryContent } from './custom/modules/CCUREReader';
import { delay } from 'bluebird';

let config: ICCUREConfig = {
	"server": "172.16.10.138",
	"port": 3537,
	"user": "sa",
	"password": "manager",
	"database": "master",
	"connectionTimeout": 15000,
};

let dsnlist: IDSNList = {
	"CFSRV": "CFSRV",
	"Jurnal": "JOURNAL"
};

let reader: CCUREReader = CCUREReader.getInstance();

let conn = reader.connectAsync(config, dsnlist);

let tryRegion = async () => {
	let result: Array<JSON> = await reader.queryAllAsync(QueryContent.Clearance, 5000);
	let onReceivedRow = (row) => {  };
	let onDoneReceive = (result) => console.log(`Received finish`, result);
	let onError = (err) => console.log(`Error happened ${err}`);
	reader.queryStream(QueryContent.Clearance, onReceivedRow, onDoneReceive, onError);
}

(async () => {
	for(var i = 0 ; i < 1000000 ; i++){
		await reader.connectAsync(config, dsnlist);
		await tryRegion();
		await reader.disconnectAsync();
		delay(100);
	}
})().catch(err =>{
	console.log(err);
});








