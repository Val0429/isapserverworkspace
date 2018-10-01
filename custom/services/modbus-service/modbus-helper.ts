import { IModbusDeviceConfig, ModbusDescriptions, ModbusFunctionCodes } from "./modbus-service";
import { readFileSync, writeFileSync, readFile, fstat } from "fs";
import { isNullOrUndefined } from "util";
import { reject, resolve, promisify } from "bluebird";
import ast from 'services/ast-services/ast-client';

export namespace ModbusHelper{

    let descriptionArray  : Array<string>  = Enum2ValueArray(ModbusDescriptions);
    let functionCodeArray : Array<string> = Enum2ValueArray(ModbusFunctionCodes);

    /**
     * Convert enum into array string using their name
     * @param enumObject 
     */
    function Enum2ValueArray(enumObject){
        var all = [];
        for(var key in enumObject){
            all.push(enumObject[key]);
        }
        return all;
    }

    /**
     * Load moxa device system config file (txt) into <interface IModbusDeviceConfig>
     * @param loc      file location
     * @param encoding 'utf-8' or others
     * 
     * return <IModbusDeviceConfig> device config
     */
    export async function LoadMoxaSystemConfig(loc : string, encoding : string = 'utf-8') : Promise<IModbusDeviceConfig> {

        let readFileCtx : string;
        try{
            readFileCtx = await (promisify(readFile) as any)(loc, encoding);
        }catch(e){
            return Promise.reject("Internal Error: <ModbusHelper::LoadMoxaSystemConfig> read file error, message : " + e);
        }

        let modbusDevConfig : IModbusDeviceConfig = {} as any;
        let lineCtx : Array<string> = await readFileCtx.split(/\r?\n/);

        try{
            //read address
            for(var i = 156 ; i < 180 ; i++){
                let descStr : string = descriptionArray[ i - 156 ];
                let address : number = parseInt(lineCtx[i].substr(lineCtx[i].indexOf('=')+1));
                modbusDevConfig[descStr.toString()] = {};
                modbusDevConfig[descStr.toString()].address = address;
            }
            
            //read function code
            for(var i = 181 ; i < 205 ; i++){
                let descStr : string = descriptionArray[ i - 181 ];
                let code = functionCodeArray[parseInt(lineCtx[i].substr(lineCtx[i].indexOf('=')+1)) - 1];
                modbusDevConfig[descStr.toString()].functionCode = code;
            }
    
            //read total channels ( use to verify )
            for(var i = 231 ; i < 255 ; i++){
                let descStr : string = descriptionArray[ i - 231 ];
                let chNum : number = parseInt(lineCtx[i].substr(lineCtx[i].indexOf('=')+1));
                modbusDevConfig[descStr.toString()].totalChannels = chNum;
            }

            //await ast.requestValidation("IModbusDeviceConfig", modbusDevConfig);

            //read ip address
            modbusDevConfig.connect_config = { } as any ;
            modbusDevConfig.connect_config.ip = lineCtx[260].substr(lineCtx[260].indexOf('=')+1);

        } catch(e){
            return Promise.reject("Internal Error: <ModbusHelper::LoadMoxaSystemConfig> analysis file content error, message : " + e);
        }

        try {
            let result = await ast.requestValidation("IModbusDeviceConfig", modbusDevConfig);
        } catch(e) {
            console.log(`Internal Error: <ModbusHelper::LoadMoxaSystemConfig> IModbusDeviceConfig verity fail, message : ${e}`);
        }
        
        return modbusDevConfig;
    }
}

