import { isEmpty }                      from "rxjs/operator/isEmpty";
import { isNull, isUndefined, isArray } from "util";
import { map }                          from "rxjs/operators";
import { BitwiseParser }                from "./bitwise-paser"
import { toArray }                      from "rxjs/operator/toArray";


/**
 * <enum> Descriptions of Moxa device
 */
export enum ModbusDescriptions{
    DO_Value                         = "DO_Value"                       ,  
    DO_Pulse_Status                  = "DO_Pulse_Status"                ,  
    DO_Value_All                     = "DO_Value_All"                   , 
    DI_Value                         = "DI_Value"                       ,  
    DI_Counter_Value                 = "DI_Counter_Value"               ,    
    DI_Value_All                     = "DI_Value_All"                   ,
    DI_Counter_StartStop             = "DI_Counter_StartStop"           ,
    DI_Counter_Reset                 = "DI_Counter_Reset"               ,
    P2P_Connect_status               = "P2P_Connect_status"             ,
    P2P_Output_Safe_Flag             = "P2P_Output_Safe_Flag"           ,
    Clear_P2P_Output_Safe_Flag       = "Clear_P2P_Output_Safe_Flag"     ,
    Clear_Watchdog_Alarm             = "Clear_Watchdog_Alarm"           ,
    DO_PulseCount                    = "DO_PulseCount"                  ,
    DO_PulseOnWidth                  = "DO_PulseOnWidth"                ,
    DO_PulseOffWidth                 = "DO_PulseOffWidth"               ,
    DI_Counter_Overflow_Flag         = "DI_Counter_Overflow_Flag"       ,
    DI_Counter_Overflow_Flag_Clear   = "DI_Counter_Overflow_Flag_Clear" ,
    Model_Name                       = "Model_Name"                     ,
    Device_Name                      = "Device_Name"                    ,
    Device_Up_Time                   = "Device_Up_Time"                 ,
    Firmware_Version                 = "Firmware_Version"               ,
    Firmware_Build_Date              = "Firmware_Build_Date"            ,
    Mac_Address                      = "Mac_Address"                    ,
    IP_Address                       = "IP_Address"
}

/**
 * <enum> Function codes of Moxa device
 */
export enum ModbusFunctionCodes {
    Coil_Status       = "Coil Status"     ,
    Input_Status      = "Input Status"    ,
    Holding_Register  = "Holding Register",
    Input_Register    = "Input Register"
}


/**
 * <Interface> Configs of moxa device 
 */
export type IModbusDeviceConfig = {
    connect_config : {
        ip      : string;
    };
} & {
    [key in keyof typeof ModbusDescriptions]: {
        address      : number;
        functionCode : ModbusFunctionCodes;
        totalChannels: number;
    };
};


/**
 * <interface> Informations of moxa device
 */
export interface IModBusDeviceInfos{
    modelName           : string;
    deviceName          : string;
    deviceUpTimeInSec   : number;
    firmware            : string;
    macAddress          : string;
    ipAddress           : string;
}



var ModbusRTU = require("modbus-serial");

/**
 * This class is use to connect moxa device by ip address.
 * It have functions that get/set values, get device infomations.
 * Example :
    let modbusClient : ModBusService;

    var testFunc = (async () => {
        let result = await modbusClient.connect(1);
        let result_write  = await modbusClient.write(ModbusDescriptions.DO_Value,0,[1,1,1,1]);
        let result_read  = await modbusClient.read(ModbusDescriptions.DO_Value,0,8);
        let infos = await modbusClient.getDeviceInfo();
        console.log(result_read);
        console.log(infos);
        modbusClient.disconnect();
    });

    ModbusHelper.LoadMoxaSystemConfig("E:/moxaConfig.txt",'utf-8').then((config)=>{
        modbusClient = new ModBusService(config);
        testFunc();
    }).catch((e)=>{
        throw e;
    })
 */
export class ModBusService {

    private config : IModbusDeviceConfig;
    private client = new ModbusRTU();

    /**
     * constructor : Initial config
     * @param config <IModbusDeviceConfig> config
     */
    constructor(config: IModbusDeviceConfig) { 
        this.setConfig(config);
    }

    /**
     * Set config when disconnected
     * @param config <IModbusDeviceConfig> config
     */
    public setConfig(config: IModbusDeviceConfig){
        if(this.isConnected()) throw `Internal Error: <ModBusService::setConfig> Still connecting, do not change config.`;
        this.verifyIP(config.connect_config.ip); 
        this.config = config;
    }

    /**
     * Get config file
     * 
     * return <IModbusDeviceConfig>
     */
    public getConfig() : IModbusDeviceConfig { return this.config; }

    /**
     * Connect to device
     * @param deviceID Assign a custom device id ( > 0 ) 
     */
    public async connect(deviceID : number) : Promise<void> {
        let result = 
            this.client.connectTCP(this.config.connect_config.ip).then(()=>{
                this.client.setID(deviceID);
                console.log("Connect to ip:<"+ this.config.connect_config.ip + "> success.")
            }).catch((e)=>{
                throw `Internal Error: <ModBusService::connect> connect fail, maybe address wrong.`;
            });
        return result;
    }

    /**
     * Disconnect with device
     */
    public disconnect(){
        this.client.close();
        console.log("Disconnect with <"+ this.config.connect_config.ip + "> complete.");
    }

    /**
     * return <boolean> Connected or not
     */
    public isConnected() : boolean{
        return  (this.client.isOpen === true) ? true : false;
    }


    /**
     * Read data from device, must be connected first.
     * @param desc   <ModbusDescriptions> which colunm want to read
     * @param index  <number> start index ( shift from started address )
     * @param length <number> read length / channel
     * 
     * return <Array<number>> data array
     */
    public async read(desc : ModbusDescriptions, index : number, length : number) : Promise<Array<number>>{
        if(this.isConnected() == false) Promise.reject(`Internal Error: <ModBusService::read> read fail, no connection.`);

        let result  : any;
        let address : number = this.config[desc.toString()].address + index;
        let addressShift = index + length;
        if(addressShift < 0 || addressShift > this.config[desc.toString()].totalChannels) 
            Promise.reject("Internal Error: <ModBusService::read> read ["+desc+"]fail, <ModBusService::read> index + length("+addressShift+") > total channels("+this.config[desc.toString()].totalChannels + ")");

        switch(this.config[desc.toString()].functionCode){
            case ModbusFunctionCodes.Coil_Status:
                result = this.client.readCoils(address,length);
                break;
            case ModbusFunctionCodes.Holding_Register:
                result = this.client.readHoldingRegisters(address,length);
                break;
            case ModbusFunctionCodes.Input_Register:
                result = this.client.readInputRegisters(address,length);
                break;
            case ModbusFunctionCodes.Input_Status:
                result = this.client.readDiscreteInputs(address,length);
                break;
        }
        try {
            let p: any = await result;
            let vals: Array<number> = (p.data as Array<number>).map( (value) => +value );
            return vals.slice(0,length);
        } 
        catch(e) {
            Promise.reject("Internal Error: <ModBusService::read> read ["+desc+"]fail, maybe index/length error or descript & code not match ( User-defined in Modbus ).");
        }
    }

    /**
     * Write data into device
     * @param desc  <ModbusDescriptions> which colunm want to write
     * @param index <number> start index ( shift from started address )
     * @param val   <Array<number>> number array
     */
    public async write(desc : ModbusDescriptions, index : number, val : Array<number> | number) : Promise<void>{
        if(this.isConnected() == false) Promise.reject(`Internal Error: <ModBusService::write> write fail, no connection.`);

        let result  : any;
        let address : number = this.config[desc.toString()].address + index;
        val = !Array.isArray(val) ? [val] : val;
        let length  : number = val.length;

        let addressShift = index + length;
        if(addressShift < 0 || addressShift > this.config[desc.toString()].totalChannels) 
            Promise.reject("Internal Error: <ModBusService::read> write ["+desc+"] fail, <ModBusService::write> index + length > total channels.");

        switch(this.config[desc.toString()].functionCode){
            case ModbusFunctionCodes.Coil_Status:
                result = this.client.writeCoils(address,val);
                break;
            case ModbusFunctionCodes.Holding_Register:
                result = this.client.writeRegisters(address,val);
                break;
            default:
                Promise.reject("Internal Error: <ModBusService::write> write ["+desc+"]fail, <ModBusService::write> not support <ModbusDescriptions::Input_*> .");
        }
        try {
            await result;
        } 
        catch(e) {
            Promise.reject("Internal Error: <ModBusService::write> write ["+desc+"]fail, maybe index/length error or descript & code not match ( User-defined in Modbus ).");
        }
    }
    
    /**
     * Get device informations, including ip, device name, module name, mac address...
     * return <IModBusDeviceInfos> 
     */
    public async getDeviceInfo() : Promise<IModBusDeviceInfos>{
        if(this.isConnected() == false) Promise.reject(`Internal Error: <ModBusService::getDeviceInfo> getDeviceInfo fail, no connection.`);
        
        let resultParam : IModBusDeviceInfos = {} as any;
        let exception   : string;

        let result_modelName    = this.read(ModbusDescriptions.Model_Name          , 0, this.config.Model_Name.totalChannels);
        let result_deviceName   = this.read(ModbusDescriptions.Device_Name         , 0, this.config.Device_Name.totalChannels);
        let result_deviceUpTime = this.read(ModbusDescriptions.Device_Up_Time      , 0, this.config.Device_Up_Time.totalChannels) ;
        let result_fwVersion    = this.read(ModbusDescriptions.Firmware_Version    , 0, this.config.Firmware_Version.totalChannels) ;
        let result_fwBuildDate  = this.read(ModbusDescriptions.Firmware_Build_Date , 0, this.config.Firmware_Build_Date.totalChannels) ;
        let result_macAddress   = this.read(ModbusDescriptions.Mac_Address         , 0, this.config.Mac_Address.totalChannels) ;
        let result_ipAddress    = this.read(ModbusDescriptions.IP_Address          , 0, this.config.IP_Address.totalChannels) ;

        try {
            let modelNameAry     : Array<number> = await BitwiseParser.Word2ByteArray(await result_modelName)    ;
            let deviceNameAry    : Array<number> = await BitwiseParser.Word2ByteArray(await result_deviceName)   ;
            let deviceUpTimeAry  : Array<number> = await BitwiseParser.Word2Int32(await result_deviceUpTime)     ;
            let fwVersionStr     : string        = await BitwiseParser.Word2ByteString(await result_fwVersion)   ;
            let fwBuildDateAry   : string        = await BitwiseParser.Word2ByteString(await result_fwBuildDate) ;
            let macAddressStr    : string        = await BitwiseParser.Word2HexString(await result_macAddress)   ;
            let ipAddressAry     : Array<number> = await BitwiseParser.Word2ByteArray(await result_ipAddress)    ;
            
            resultParam.modelName         = String.fromCharCode(...modelNameAry).replace(/\0/g,'').trim();
            resultParam.deviceName        = String.fromCharCode(...deviceNameAry).replace(/\0/g,'').trim();
            resultParam.deviceUpTimeInSec = deviceUpTimeAry[0];
            resultParam.firmware          = "V" + fwVersionStr + " Build" + fwBuildDateAry;
            resultParam.macAddress        = macAddressStr.replace(/(.{2})/g,"$1-").substr(0,17);
            resultParam.ipAddress         = ipAddressAry[0] + '.' + ipAddressAry[1] + '.' + ipAddressAry[2] + '.' + ipAddressAry[3];

            return resultParam;

        } catch(e) {
            Promise.reject(`Internal Error: <ModBusService::getDeviceInfo> getDeviceInfo fail.`);
        }
    }

    /**
     * Verify ip
     * @param address ip address. e.g. "192.168.127.254"
     */
    private verifyIP(address: string) : void{
        let isThrow : boolean = false;
        let strArr : Array<string> = address.split('.');

        if(strArr.length != 4) isThrow = true;
        for(let i : number = 0 ; i < 4 ; i++){
            var num = Number(strArr[i]);
            if(isNaN(num) || num < 0 || num > 255){
                throw `Internal Error: <ModBusService::verifyIP> address format error, address ip:<`+ address + '>';
            }
        }
    }

}

