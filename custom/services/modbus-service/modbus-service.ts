import { isEmpty }                      from "rxjs/operator/isEmpty";
import { isNull, isUndefined }          from "util";
import { map }                          from "rxjs/operators";
import { BitwiseParser }                from "./bitwise-paser"


var ModbusRTU = require("modbus-serial");


/*
*   Moxa I/O Descriptions -> Values, Pulses, Flags, and counters 
*/
export enum ModbusDescriptions{
    DO_Value                         = 0x0001,  
    DO_Pulse_Status                  = 0x0002,  
    DO_Value_All                     = 0x0003, 
     
    DI_Value                         = 0x0011,  
    DI_Counter_Value                 = 0x0012,    
    DI_Value_All                     = 0x0013,
    DI_Counter_StartStop             = 0x0014,
    DI_Counter_Reset                 = 0x0015,

    P2P_Connect_status               = 0x0021,
    P2P_Output_Safe_Flag             = 0x0022,

    Clear_P2P_Output_Safe_Flag       = 0x0031,
    Clear_Watchdog_Alarm             = 0x0032,

    DO_PulseCount                    = 0x0004,
    DO_PulseOnWidth                  = 0x0005,
    DO_PulseOffWidth                 = 0x0006,
    DI_Counter_Overflow_Flag         = 0x0016,
    DI_Counter_Overflow_Flag_Clear   = 0x0017,

    Address_Mode                     = 0x00FF
}

/*
*   Moxa I/O Descriptions -> Device name, model infos, address...
*/
export interface IModBusDeviceInfos{
    modelName       :       string  ;   //E1212
    deviceName      :       string  ;   //Usually empty
    deviceUpTime    :       number  ;   //In second
    firmware        :       string  ;   //V3000 Build17111512
    macAddress      :       string  ;   //00-90-e8-48-cf-be
    ipAddress       :       string  ;   //192.168.127.254
}

/*
*   Moxa function code types
*/
export enum ModBusCodeType {
    Coil_Status         ,
    Input_Status        ,
    Holding_Register    ,
    Input_Register
}

export interface IModBusConfig{
    address :  string;
    id      :  number;
}

export interface IModBusRead{
    desc   : ModbusDescriptions ;
    code   : ModBusCodeType     ;
    index  : number             ;   //if desc === Address_Mode, index = address
    length : number             ;
}

export interface IModBusWrite{
    desc   : ModbusDescriptions   ;
    code   : ModBusCodeType       ;
    index  : number               ; //if desc === Address_Mode, index = address
    val    : Array<number>        ;
}

/*
*  Dictionary : Mapping description and device address
*/
class Dictionary {
    [index: number]: number;
}

let dicAddress : Dictionary = new Dictionary();

dicAddress[ModbusDescriptions.DO_Value]                         = 0     ;
dicAddress[ModbusDescriptions.DO_Pulse_Status]                  = 16    ;
dicAddress[ModbusDescriptions.DO_Value_All]                     = 32    ;

dicAddress[ModbusDescriptions.DI_Value]                         = 0     ;
dicAddress[ModbusDescriptions.DI_Counter_Value]                 = 16    ;
dicAddress[ModbusDescriptions.DI_Value_All]                     = 48    ;
dicAddress[ModbusDescriptions.DI_Counter_StartStop]             = 256   ;
dicAddress[ModbusDescriptions.DI_Counter_Reset]                 = 272   ;

dicAddress[ModbusDescriptions.P2P_Connect_status]               = 4096  ;
dicAddress[ModbusDescriptions.P2P_Output_Safe_Flag]             = 4112  ;

dicAddress[ModbusDescriptions.Clear_P2P_Output_Safe_Flag]       = 4128  ;
dicAddress[ModbusDescriptions.Clear_Watchdog_Alarm]             = 4144  ;

dicAddress[ModbusDescriptions.DO_PulseCount]                    = 36    ;
dicAddress[ModbusDescriptions.DO_PulseOnWidth]                  = 52    ;
dicAddress[ModbusDescriptions.DO_PulseOffWidth]                 = 68    ;

dicAddress[ModbusDescriptions.DI_Counter_Overflow_Flag]         = 1000  ;
dicAddress[ModbusDescriptions.DI_Counter_Overflow_Flag_Clear]   = 288   ;

dicAddress[ModbusDescriptions.Address_Mode]                     = 0     ;

/*
*   This class is use to connect moxa device by ip address.
*   It have functions that get/set values, get device infomations.
*   Example:
*   
*/
export class ModBusService {

    private config : IModBusConfig;
    private client = new ModbusRTU();

    constructor(config: IModBusConfig) { 
        this.setConfig(config);
    }

    /*
    *   Connection Relation
    */

    //Set a new config when disconnecting 
    public setConfig(config: IModBusConfig){
        if(this.isConnected()) throw `Internal Error: <ModBusService::setConfig> Still connecting, do not change config.`;
        this.verifyIP(config.address); 
        this.config = config;
    }

    //Get config in anytime, return  <IModBusConfig>
    public getConfig() : IModBusConfig { return this.config; }

    //Connect to the moxa device. Log connect success when successful, throw fail when connecting error.
    public async connect() : Promise<void> {
        let result = 
            this.client.connectTCP(this.config.address).then(()=>{
                this.client.setID(this.config.id);
                console.log("Connect to ip:<"+ this.config.address + "> success.")
            }).catch((e)=>{
                throw `Internal Error: <ModBusService::connect> connect fail, maybe address wrong.`;
            });
        return result;
    }

    //Disconnect
    public disconnect(){
        this.client.close();
        console.log("Disconnect with <"+ this.config.address + "> complete.");
    }

    //return true if connect == true
    public isConnected() : boolean{
        return  (this.client.isOpen === true) ? true : false;
    }


    /*
    *   Read data using enum descriptions and function codes.
    */
    public async read(IRead : IModBusRead) : Promise<Array<number>>{

        if(this.isConnected() == false) Promise.reject(`Internal Error: <ModBusService::read> read fail, no connection.`);
        if(IRead.desc !== ModbusDescriptions.Address_Mode)
            if(IRead.index < 0 || IRead.index > 16) Promise.reject(`Internal Error: <ModBusService::read> read fail, <Interface IModBusRead.index> must between 0 and 16.`);

        let result  : any;
        let address : number = dicAddress[IRead.desc] + IRead.index;
        let length  : number = IRead.length;

        if(length < 0 || length > 16) Promise.reject(`Internal Error: <ModBusService::read> write fail, <Interface IModBusRead.length> must be between 0 and 16.`);

        switch(IRead.code){
            case ModBusCodeType.Coil_Status:
                result = this.client.readCoils(address,length);
                break;
            case ModBusCodeType.Holding_Register:
                result = this.client.readHoldingRegisters(address,length);
                break;
            case ModBusCodeType.Input_Register:
                result = this.client.readInputRegisters(address,length);
                break;
            case ModBusCodeType.Input_Status:
                result = this.client.readDiscreteInputs(address,length);
                break;
        }
        try {
            let p: any = await result;
            let vals: Array<number> = (p.data as Array<number>).map( (value) => +value );
            return vals.slice(0,IRead.length);
        } 
        catch(e) {
            Promise.reject(`Internal Error: <ModBusService::read> read fail, maybe index/length error or descript & code not match ( User-defined in Modbus ).`);
        }
    }

    /*
    *   Write data using enum descriptions and function codes.
    */
    public async write(IWrite : IModBusWrite) : Promise<void>{
        if(this.isConnected() == false) Promise.reject(`Internal Error: <ModBusService::write> write fail, no connection.`);
        if(IWrite.desc !== ModbusDescriptions.Address_Mode)
            if(IWrite.index < 0 || IWrite.index > 16) Promise.reject(`Internal Error: <ModBusService::write> write fail, <Interface IModBusWrite.index> must between 0 and 16.`);

        let result  : any;
        let address : number = dicAddress[IWrite.desc] + IWrite.index;
        let length  : number = IWrite.val.length;

        if(length < 0 || length > 16) Promise.reject(`Internal Error: <ModBusService::write> write fail, <Interface IModBusWrite.length> must be between 0 and 16.`);

        switch(IWrite.code){
            case ModBusCodeType.Coil_Status:
                result = this.client.writeCoils(address,IWrite.val);
                break;
            case ModBusCodeType.Holding_Register:
                result = this.client.readHoldingRegisters(address,length);
                break;
            default:
                Promise.reject(`Internal Error: <ModBusService::write> write fail, <Interface IModBusWrite.code> not support 'Input_*' .`);
        }
        try {
            await result;
        } 
        catch(e) {
            Promise.reject(`Internal Error: <ModBusService::read> read fail, maybe index/length error or descript & code not match ( User-defined in Modbus ).`);
        }
    }

    /*
    *   Get all device infos
    */
    public async getDeviceInfo() : Promise<IModBusDeviceInfos>{
        if(this.isConnected() == false) Promise.reject(`Internal Error: <ModBusService::getDeviceInfo> getDeviceInfo fail, no connection.`);
        
        let resultParam : IModBusDeviceInfos = {} as any;
        let exception   : string;

        let result_modelName    = this.client.readInputRegisters(5000,10);
        let result_deviceName   = this.client.readInputRegisters(5040,30);
        let result_deviceUpTime = this.client.readInputRegisters(5020,2) ;
        let result_fwVersion    = this.client.readInputRegisters(5029,2) ;
        let result_fwBuildDate  = this.client.readInputRegisters(5031,2) ;
        let result_macAddress   = this.client.readInputRegisters(5024,3) ;
        let result_ipAddress    = this.client.readInputRegisters(5027,2) ;

        try {
            let modelNameAry     : Array<number> = await BitwiseParser.Word2ByteArray((await result_modelName).data)    ;
            let deviceNameAry    : Array<number> = await BitwiseParser.Word2ByteArray((await result_deviceName).data)   ;
            let deviceUpTimeAry  : Array<number> = await BitwiseParser.Word2Int32((await result_deviceUpTime).data)     ;
            let fwVersionStr     : string        = await BitwiseParser.Word2ByteString((await result_fwVersion).data)   ;
            let fwBuildDateAry   : string        = await BitwiseParser.Word2ByteString((await result_fwBuildDate).data) ;
            let macAddressStr    : string        = await BitwiseParser.Word2HexString((await result_macAddress).data)   ;
            let ipAddressAry     : Array<number> = await BitwiseParser.Word2ByteArray((await result_ipAddress).data)    ;
            
            resultParam.modelName   = String.fromCharCode(...modelNameAry).replace(/\0/g,'').trim();
            resultParam.deviceName  = String.fromCharCode(...deviceNameAry).replace(/\0/g,'').trim();
            resultParam.deviceUpTime= deviceUpTimeAry[0];
            resultParam.firmware    = "V" + fwVersionStr + " Build" + fwBuildDateAry;
            resultParam.macAddress  = macAddressStr.replace(/(.{2})/g,"$1-").substr(0,17);
            resultParam.ipAddress   = ipAddressAry[0] + '.' + ipAddressAry[1] + '.' + ipAddressAry[2] + '.' + ipAddressAry[3];

            return resultParam;

        } catch(e) {
            Promise.reject(`Internal Error: <ModBusService::read> read fail.`);
        }

        return;
    }

    //Verify IP address format    
    private verifyIP(address: string) : void{
        let isThrow : boolean = false;
        let strArr : Array<string> = address.split('.');

        if(strArr.length != 4) isThrow = true;
        for(let i : number = 0 ; i < 4 ; i++){
            var num = Number(strArr[i]);
            if(isNaN(num) || num < 0 || num > 255){
                isThrow = true;
                break;
            }
        }
        if(isThrow) throw `Internal Error: <ModBusService::verifyIP> address format error, address ip:<`+ address + '>';
    }

}

