import {CCUREService} from "./../CCURE"
import { delay } from "bluebird";


export async function GetMigrationData(){
    let _service : CCUREService = new CCUREService();
    _service.Login();
    let permTables = await _service.GetAllPermissionTables();
    let permTableDoor = await _service.GetAllPermissionTableDoor();
    let permTableDoorGroup = await _service.GetAllPermissionTableDoorGroup();
    let timeSchedules = await _service.GetAllTimeSchedules();
    let groupMember = await _service.GetAllGroupMember();
    let devices = await _service.GetAllDevices();


    let permTablesKeyMap = GetKeyMap(permTables,"permissionTableId", "permissionTableName");
    let timeSchedulesKeyMap = GetKeyMap(timeSchedules,"timespecId", "timespecName");
    let devicesKeyMap = GetKeyMap(devices,"deviceId", "deviceName");

    console.log(timeSchedulesKeyMap[1620]);
    
}

function GetKeyMap(jsons: JSON[], keyIDName : string, valueName : string) : Map<number,string>{
    let result = new Map();
    for(var i = 0 ; i < jsons.length ; i++){
        result[jsons[i][keyIDName]] = jsons[i][valueName];
    }
    return result;
}