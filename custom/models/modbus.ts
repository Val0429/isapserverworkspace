import { IModbusDeviceConfig, ModbusFunctionCodes } from "../services/modbus-service/modbus-service";

let ModbusDeviceConfig : IModbusDeviceConfig = {

    connect_config : {
        ip : "192.168.127.254",
    },

    DO_Value : {
        address      : 0,
        functionCode : ModbusFunctionCodes.Coil_Status,
        totalChannels: 8
    },

    DO_Pulse_Status : {
        address      : 16,
        functionCode : ModbusFunctionCodes.Coil_Status,
        totalChannels: 8
    },  

    DO_Value_All : {
        address      : 32,
        functionCode : ModbusFunctionCodes.Holding_Register,
        totalChannels: 1
    }, 
     
    DI_Value : {
        address      : 0,
        functionCode : ModbusFunctionCodes.Input_Status,
        totalChannels: 16
    }, 

    DI_Counter_Value : {
        address      : 16,
        functionCode : ModbusFunctionCodes.Input_Register,
        totalChannels: 16
    }, 

    DI_Value_All : {
        address      : 48,
        functionCode : ModbusFunctionCodes.Input_Register,
        totalChannels: 1
    },

    DI_Counter_StartStop : {
        address      : 256,
        functionCode : ModbusFunctionCodes.Coil_Status,
        totalChannels: 16
    },

    DI_Counter_Reset : {
        address      : 272,
        functionCode : ModbusFunctionCodes.Coil_Status,
        totalChannels: 16
    },

    P2P_Connect_status : {
        address      : 4096,
        functionCode : ModbusFunctionCodes.Input_Status,
        totalChannels: 8
    },

    P2P_Output_Safe_Flag : {
        address      : 4112,
        functionCode : ModbusFunctionCodes.Input_Status,
        totalChannels: 8
    },

    Clear_P2P_Output_Safe_Flag : {
        address      : 4128,
        functionCode : ModbusFunctionCodes.Coil_Status,
        totalChannels: 8
    },

    Clear_Watchdog_Alarm : {
        address      : 4144,
        functionCode : ModbusFunctionCodes.Coil_Status,
        totalChannels: 1
    },

    DO_PulseCount : {
        address      : 36,
        functionCode : ModbusFunctionCodes.Holding_Register,
        totalChannels: 8
    },

    DO_PulseOnWidth : {
        address      : 52,
        functionCode : ModbusFunctionCodes.Holding_Register,
        totalChannels: 8
    },

    DO_PulseOffWidth : {
        address      : 68,
        functionCode : ModbusFunctionCodes.Holding_Register,
        totalChannels: 8
    },

    DI_Counter_Overflow_Flag : {
        address      : 1000,
        functionCode : ModbusFunctionCodes.Input_Status,
        totalChannels: 16
    },

    DI_Counter_Overflow_Flag_Clear : {
        address      : 288,
        functionCode : ModbusFunctionCodes.Coil_Status,
        totalChannels: 16
    },

    Model_Name : {
        address      : 5000,
        functionCode : ModbusFunctionCodes.Input_Register,
        totalChannels: 10
    },

    Device_Name : {
        address      : 5040,
        functionCode : ModbusFunctionCodes.Input_Register,
        totalChannels: 30
    },

    Device_Up_Time : {
        address      : 5020,
        functionCode : ModbusFunctionCodes.Input_Register,
        totalChannels: 2
    },

    Firmware_Version : {
        address      : 5029,
        functionCode : ModbusFunctionCodes.Input_Register,
        totalChannels: 2
    },

    Firmware_Build_Date : {
        address      : 5031,
        functionCode : ModbusFunctionCodes.Input_Register,
        totalChannels: 2
    },

    Mac_Address : {
        address      : 5024,
        functionCode : ModbusFunctionCodes.Input_Register,
        totalChannels: 3
    },

    IP_Address : {
        address      : 5027,
        functionCode : ModbusFunctionCodes.Input_Register,
        totalChannels: 2
    }
}

export { ModbusDeviceConfig }
