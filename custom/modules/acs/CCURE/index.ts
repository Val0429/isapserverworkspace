import { CCUREReader } from './CCUREReader'
import { QueryContent } from './queryMap'
import { SignalObject } from "./signalObject";
import { isNullOrUndefined } from 'util';

type OnRawsCallback = (rows: JSON[], queryContent: QueryContent) => void;

interface IdNameMap {
    [key: number]: string;
}

/**
 * Note : All methods on this class are "Async"
 */
export class CCUREService {

/* Private variables */

    //Wait for connected time (ms)
    protected _waitTime: number = 5000;

    // Reader Instance
    protected _reader: CCUREReader = CCUREReader.getInstance();

    //Singal Object, use to wait for connected, default set to this._waitTime ms
    protected _signal: SignalObject = new SignalObject(false);

    //Save id<--->name   :   key--value
    protected _idNameMap: IdNameMap = {};

/* Login / Out */

    //Connect to SQL server
    public async Login() {
        await this._reader.connectAsync();
        this._signal.set(true);
    }

    //Disconnect to SQL server
    public async Logout() {
        this._signal.set(false);
        this._reader.disconnectAsync();
    }

/* Get New Report Related */

    /**
     * Get last update report time
     */
    public GetLastUpdateReportTime(): Date {
        return this._reader.getLastReportQueryTime();
    }

    /**
     * Set last update report time
     * @param dt report time
     */
    public SetLastUpdateReportTime(dt: Date): void {
        this._reader.setLastReportQueryTime(dt);
    }

/* Help Functions */

    /**
     * Get Name from id index, including person, door, clearance,...
     * @param id id
     */
    public async GetNameById(id: number|string): Promise<string> {
        if (isNullOrUndefined(this._idNameMap[id])) {
            var temp = await this.GetAllObjects();
            console.log(temp);
            console.log(temp.length);
            for (var i = 0; i < temp.length; i++) {
                var keyId = temp[i]["objId"];
                console.log(temp.length);

                this._idNameMap[keyId]=temp[i]["objName"];
            }
        }
        return this._idNameMap[id];
    }

/* Get All Function */

    /*
    [
        { 
            reportId: 10000001090,
            personId: null,
            personName: '證卡 #35798',
            cardNum: 35798,
            doorId: '2087',
            doorName: 'D001',
            apcId: '2076',
            apcName: 'Apc#01 MS:1 R1',
            messageCode: 1003,
            message: '在 D001 [入] [場區代碼]  拒絕 證卡 #35798',
            updateTime: 2008-04-18T14:03:49.000Z 
        },
        { 
            reportId: 10000001091,
            personId: null,
            personName: '證卡 #35798',
            cardNum: 35798,
            doorId: '2087',
            doorName: 'D001',
            apcId: '2076',
            apcName: 'Apc#01 MS:1 R1',
            messageCode: 1003,
            message: '在 D001 [入] [證卡不明]  拒絕 證卡 #35798',
            updateTime: 2008-04-18T14:04:21.000Z 
        }
    ]
    */
    /**
      * IF [messageCode]==1002 : 人-卡:核可進入
      * IF [messageCode]==1003 : 人-卡:拒絕進入
      * @param OnRaws If OnRaws != null, streaming receive, then return will be NULL
      */
    public async GetNewAccessReport(OnRaws?: OnRawsCallback): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.ReportsNewUpdate, OnRaws, null);
            return null;
        }
        else return this._reader.queryAllAsync(QueryContent.ReportsNewUpdate, null, 30000);
    }

    /*
    [
        { 
            reportId: 10000001090,
            personId: null,
            personName: '證卡 #35798',
            cardNum: 35798,
            doorId: '2087',
            doorName: 'D001',
            apcId: '2076',
            apcName: 'Apc#01 MS:1 R1',
            messageCode: 1003,
            message: '在 D001 [入] [場區代碼]  拒絕 證卡 #35798',
            updateTime: 2008-04-18T14:03:49.000Z 
        },
        { 
            reportId: 10000001091,
            personId: null,
            personName: '證卡 #35798',
            cardNum: 35798,
            doorId: '2087',
            doorName: 'D001',
            apcId: '2076',
            apcName: 'Apc#01 MS:1 R1',
            messageCode: 1003,
            message: '在 D001 [入] [證卡不明]  拒絕 證卡 #35798',
            updateTime: 2008-04-18T14:04:21.000Z 
        }
    ]
    */
    /**
      * IF [messageCode]==1002 : 人-卡:核可進入
      * IF [messageCode]==1003 : 人-卡:拒絕進入
      * @param OnRaws If OnRaws != null, streaming receive, then return will be NULL
      */
    public async GetAllAccessReport(OnRaws?: OnRawsCallback): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.Reports, OnRaws, null);
            return null;
        }
        else return this._reader.queryAllAsync(QueryContent.Reports, null, 30000);
    }

    /*
    [
        { 
            badgeLayoutId: 154135, 
            badgeLayoutName: 'Security-01' 
        },
        { 
            badgeLayoutId: 154364, 
            badgeLayoutName: 'NCIC-外包商-01' 
        }
    ]
    */
    /**
     * 
     * @param OnRaws If OnRaws != null, streaming receive, then return will be NULL
     */
    public async GetAllBadgeLayout(OnRaws?: OnRawsCallback): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.BadgeLayout, OnRaws, null);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.BadgeLayout, null, 5000);
    }

    /*
    [
        { 
            fieldId: 1000000017, 
            fieldValue: '顧問', 
            seqId: 3 
        },
        { 
            fieldId: 1000000017, 
            fieldValue: '臨時', 
            seqId: 4 
        }
    ]
    */
    /**
     * 
     * @param OnRaws If OnRaws != null, streaming receive, then return will be NULL
     */
    public async GetAllEnumFieldValue(OnRaws?: OnRawsCallback): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.EnumFields, OnRaws, null);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.EnumFields, null, 5000);
    }

    /*
    [
        { 
            personId: 60343,
            firstName: '',
            middleName: '',
            lastName: '高鈴逸',
            engName: 'Annie Kao',
            employeeNo: '75677',
            cardNum: 0,
            fullCardNumber: 77541,
            pin: 30380157,
            deleted: false,
            lost: false,
            activationTime: 702748800,
            expirationTime: 917798340,
            updateTime: 917820022,
            updatedPerson: 27004 
        },
        {   
            personId: 30853,
            firstName: '',
            middleName: '',
            lastName: '黃吳意',
            engName: '離職刪除',
            employeeNo: '72721',
            cardNum: 0,
            fullCardNumber: 75096,
            pin: 165887807,
            deleted: false,
            lost: false,
            activationTime: 657388800,
            expirationTime: 870364740,
            updateTime: 885707145,
            updatedPerson: 3909 
        }
    ]
    */
    /**
     * 
     * @param OnRaws If OnRaws != null, streaming receive, then return will be NULL
     */
    public async GetAllPersons(OnRaws?: OnRawsCallback): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.Persons, OnRaws, null);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.Persons, null, 30000);
    }

    /*
    [
        { 
            personId: 90845,
            fieldId: 1000000026,
            fieldName: '普查日期2',
            charVal: null,
            decimalVal: null 
        },
        { 
            personId: 90846,
            fieldId: 1000000026,
            fieldName: '普查日期2',
            charVal: null,
            decimalVal: null 
        }
    ]
    */
    /**
     * 
     * @param OnRaws If OnRaws != null, streaming receive, then return will be NULL
     */
    public async GetAllPersonExtendInfo(OnRaws?: OnRawsCallback): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.PersonExtendInfo, OnRaws, null);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.PersonExtendInfo, null, 30000);
    }

    /*
    [
        { 
            fieldId: 1000000087, 
            value: '補發-損壞', 
            deleted: false 
        },
        { 
            fieldId: 1000000087, 
            value: '補發-遺失', 
            deleted: false 
        }
    ]
    */
    /**
     * Note: Different kinds of field, value will put on one of charVal and decimalVal
     * @param OnRaws If OnRaws != null, streaming receive, then return will be NULL
     */
    public async GetAllPersonExtendInfoEnumList(OnRaws?: OnRawsCallback): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.PersonExtendInfoEnumList, OnRaws, null);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.PersonExtendInfoEnumList, null, 5000);
    }

    /*
    Return:
    [ 
        { 
           timespecId: 1620, 
           timespecName: '$預設的時間規格' 
        }, 
        { 
           timespecId: 1682, 
           timespecName: '$永遠' 
        }
    ]
    */
    /**
     * @param OnRaws If OnRaws != null, streaming receive, then return will be NULL
     */
    public async GetAllTimeSchedules(OnRaws?: OnRawsCallback): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.Timespec, OnRaws, null);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.Timespec);
    }

    /*
    Return:
    [ 
        { 
            timespecId: 32486,
            dayCode: 6,
            startTime: 34200,
            endTime: 61200 
        },
        { 
            timespecId: 32486,
            dayCode: 8,
            startTime: 34200,
            endTime: 61200 
        }
     ]
     */
    /**
     * IF [dayCode]==1,2,3,...,7 : 一,二,三,...,日 
     * IF [dayCode]==8 : 星期一到星期五 
     * IF [dayCode]==44 : 星期六與星期日 
     * IF [dayCode]==1638,1639,... : 假日清單(未知)
     * [startTime] and [endTime] 從半夜00:00計算到該時間的"秒數"
     * @param OnRaws If OnRaws != null, streaming receive, then return will be NULL
     */
    public async GetAllTimeScheduleDay(OnRaws?: OnRawsCallback): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.TimespecDays, OnRaws, null);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.TimespecDays);
    }

    /*
    Return:
    [ 
        { 
            deviceId: 3404,
            deviceName: 'NHHQ_A2-2_R2_05G042',
            doorId: 4962,
            online: false,
            description: '' 
        },
        { 
            deviceId: 3405,
            deviceName: 'NHHQ_A2-2_R3_05G043',
            doorId: 4963,
            online: true,
            description: '' 
        }
    ]
    */
    /**
     * @param OnRaws If OnRaws != null, streaming receive, then return will be NULL
     */
    public async GetAllDevices(OnRaws?: OnRawsCallback): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.Reader, OnRaws, null);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.Reader);
    }

    /*
    Return:
    [ 
        { 
            doorId: 4976,
            doorName: 'N1_NHHQ_C_06G072',
            Door_Has_RTE: true,
            Unlock_Door_on_RTE: true,
            Shunt_DSM_on_RTE: true,
            Continuously_Active: true,
            Relock_After_Open: true,
            Delay_Relock_Time: 0,
            unlockTime: 5,
            shuntTime: 30,
            description: '' 
        },
        { 
            doorId: 4977,
            doorName: 'N1_NHHQ_C_06G073',
            Door_Has_RTE: false,
            Unlock_Door_on_RTE: true,
            Shunt_DSM_on_RTE: false,
            Continuously_Active: true,
            Relock_After_Open: true,
            Delay_Relock_Time: 0,
            unlockTime: 0,
            shuntTime: 0,
            description: '' 
        }
    ]
    */
    /**
     * @param OnRaws If OnRaws != null, streaming receive, then return will be NULL
     */
    public async GetAllDoors(OnRaws?: OnRawsCallback): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.Doors, OnRaws, null);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.Doors);
    }

    /*
    [
        { 
            floorId: 64358,
            floorName: 'S_KSMSC_D客梯 7F',
            online: true,
            description: '' 
        },
        { 
            floorId: 64359,
            floorName: 'S_KSMSC_D客梯 8F',
            online: true,
            description: '' 
        }
    ]
    */
    /**
     * 
     * @param OnRaws If OnRaws != null, streaming receive, then return will be NULL
     */
    public async GetAllFloors(OnRaws?: OnRawsCallback): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.Floor, OnRaws, null);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.Floor);
    }

    /*
    [
        { 
            elevatorId: 64316,
            elevatorName: 'S_KSMSC_S_10G00A',
            deviceId: 64283,
            online: true,
            description: 'KaoHsiung MSC A客梯' 
        },
        { 
            elevatorId: 2147483635,
            elevatorName: '$預設的電梯 (15162)',
            deviceId: null,
            online: false,
            description: '' 
        }
    ]
    */
    /**
     * 
     * @param OnRaws If OnRaws != null, streaming receive, then return will be NULL
     */
    public async GetAllElevators(OnRaws?: OnRawsCallback): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.Elevator, OnRaws, null);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.Elevator);
    }

    /*
        [
            { 
                elevatorFloorId: 65197,
                elevatorId: 64313,
                floorId: 64358,
                deleted: false 
            },
            { 
                elevatorFloorId: 65198,
                elevatorId: 64313,
                floorId: 64359,
                deleted: false 
            }
        ]
    */
    /**
    * 
    * @param OnRaws If OnRaws != null, streaming receive, then return will be NULL
    */
    public async GetAllElevatorFloor(OnRaws?: OnRawsCallback): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.ElevatorFloor, OnRaws, null);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.ElevatorFloor);
    }

    /*
    [
        { 
            permissionTableId: 5205,
            permissionTableName: 'C_Nantou-HUB-ALL' 
        },
        { 
            permissionTableId: 5604,
            permissionTableName: 'N1_NHHQ_6F-D22' 
        }
    ]
    */
    /**
     * 
     * @param OnRaws If OnRaws != null, streaming receive, then return will be NULL
     */
    public async GetAllPermissionTables(OnRaws?: OnRawsCallback): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.Clearance, OnRaws, null);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.Clearance);
    }

    /*
    [
        { 
            permissionTableId: 5028, 
            personId: 14775 
        },
        { 
            permissionTableId: 5028, 
            personId: 3032 
        }
    ]
    */
    /**
     * 
     * @param OnRaws If OnRaws != null, streaming receive, then return will be NULL
     */
    public async GetAllPermissionTablePerson(OnRaws?: OnRawsCallback): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.ClearPerson, OnRaws, null);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.ClearPerson);
    }

    /*
    [
        { 
            permissionTableId: 5179, 
            doorId: 113956, 
            timespecId: 1682 
        },
        { 
            permissionTableId: 5182, 
            doorId: 5441, 
            timespecId: 5209 
        }
    ]
    */
    /**
     * 
     * @param OnRaws If OnRaws != null, streaming receive, then return will be NULL
     */
    public async GetAllPermissionTableDoor(OnRaws?: OnRawsCallback): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.ClearDoor, OnRaws, null);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.ClearDoor);
    }

    /*
    [
        { 
            permissionTableId: 5071, 
            groupId: 48626, 
            timespecId: 1682 
        },
        { 
            permissionTableId: 5071, 
            groupId: 48632, 
            timespecId: 1682 
        }
    ]
    */
    /**
     * 
     * @param OnRaws If OnRaws != null, streaming receive, then return will be NULL
     */
    public async GetAllPermissionTableDoorGroup(OnRaws?: OnRawsCallback): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.ClearDoorGroup, OnRaws, null);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.ClearDoorGroup);
    }

    /*
    [
        { 
            permissionTableId: 42312,
            elevatorOrGroupId: 64313,
            floorOrGroupId: 64313,
            timespecId: 1682 
        },
        { 
            permissionTableId: 42312,
            elevatorOrGroupId: 64314,
            floorOrGroupId: 64314,
            timespecId: 1682 
        }
    ]
    */
    /**
     * 
     * @param OnRaws If OnRaws != null, streaming receive, then return will be NULL
     */
    public async GetAllPermissionTableElevatorFloor(OnRaws?: OnRawsCallback): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.ClearElevatorFloor, OnRaws, null);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.ClearElevatorFloor);
    }

    /*
    [
        { 
            groupId: 10444, 
            groupName: 'DG_N2_PCMSC_IV-控制室-A7' 
        },
        { 
            groupId: 10513, 
            groupName: 'DG_N2_PCMSC_IV-控制室-A8' 
        }
    ]
    */
    /**
     * 
     * @param OnRaws If OnRaws != null, streaming receive, then return will be NULL
     */
    public async GetAllDoorGroup(OnRaws?: OnRawsCallback): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.DoorGroup, OnRaws, null);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.DoorGroup);
    }

    /*
    [
        { 
            groupId: 10444, 
            groupName: 'DG_N2_PCMSC_IV-控制室-A7' 
        },
        { 
            groupId: 10513, 
            groupName: 'DG_N2_PCMSC_IV-控制室-A8' 
        }
    ]
    */
    /**
     * 
     * @param OnRaws If OnRaws != null, streaming receive, then return will be NULL
     */
    public async GetAllFloorGroup(OnRaws?: OnRawsCallback): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.FloorGroup, OnRaws, null);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.FloorGroup);
    }

    /*
    [
        { 
            groupId: 1669, 
            groupName: '$所有電梯' 
        },
        { 
            groupId: 65166, 
            groupName: 'EleG_S_KSMSC_A,B,C,D客梯' 
        }
    ]
    */
    /**
     * 
     * @param OnRaws If OnRaws != null, streaming receive, then return will be NULL
     */
    public async GetAllElevatorGroup(OnRaws?: OnRawsCallback): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.ElevatorGroup, OnRaws, null);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.ElevatorGroup);
    }

    /*
    [
        { 
            groupId: 5484, 
            objectId: 4894 
        },
        { 
            groupId: 5484, 
            objectId: 4895 
        }
    ]
    */
    /**
     * 
     * @param OnRaws If OnRaws != null, streaming receive, then return will be NULL
     */
    public async GetAllGroupMember(OnRaws?: OnRawsCallback): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.GroupMember, OnRaws, null);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.GroupMember, null, 30000);
    }

    /*
    [
        { 
            personId: 92626,
            userName: 'lydia lin',
            password: 'vHdUWL]qTEaua{~`',
            enabled: true,
            ODBCEnabled: true 
        },
        { 
            personId: 96335,
            userName: '$AP-CCURE',
            password: 'Iw{u@STEy\\emeGmR',
            enabled: true,
            ODBCEnabled: false 
        }
    ]
    */
    /**
     * 
     * @param OnRaws If OnRaws != null, streaming receive, then return will be NULL
     */
    public async GetAllUsers(OnRaws?: OnRawsCallback): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.Users, OnRaws, null);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.Users);
    }

    /*
        [
            { 
                objId: 1671, 
                objName: '$所有樓層', 
                isDeleted: false, 
                objType: 30 
            },
            { 
                objId: 1672,
                objName: '$所有 CCTV 交換器',
                isDeleted: false,
                objType: 45 
            }
        ]
    */
    /**
    * 
    * @param OnRaws If OnRaws != null, streaming receive, then return will be NULL
    */
    public async GetAllObjects(OnRaws?: OnRawsCallback): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.ObjectList, OnRaws, null);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.ObjectList, null, 30000);
    }


/* Get and Query with condition functions */



    /**
     *  reportId: 10000001090,
        personId: null,
        personName: '證卡 #35798',
        cardNum: 35798,
        doorId: '2087',
        doorName: 'D001',
        apcId: '2076',
        apcName: 'Apc#01 MS:1 R1',
        messageCode: 1003,
        message: '在 D001 [入] [場區代碼]  拒絕 證卡 #35798',
        updateTime: 2008-04-18T14:03:49.000Z 
    * @param condition Query string, e.g. cardNum=35798 and doorId=2087
    * @param OnRaws If OnRaws != null, streaming receive, then return will be NULL
    */
    public async GetAccessReport(condition: String, OnRaws?: OnRawsCallback): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.Reports, OnRaws, null, null, condition);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.Reports, condition, 30000);
    }

    /**
     *   badgeLayoutId: 154135, 
         badgeLayoutName: 'Security-01'  
     * @param condition Query string, e.g. lost=true and deleted=false
     * @param OnRaws If OnRaws != null, streaming receive, then return will be NULL
     */
    public async GetBadgeLayout(condition: String, OnRaws?: OnRawsCallback): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.BadgeLayout, OnRaws, null, null, condition);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.BadgeLayout, condition, 30000);
    }
    
    /*
    [
        { 
            fieldId: 1000000017, 
            fieldValue: '顧問', 
            seqId: 3 
        },
        { 
            fieldId: 1000000017, 
            fieldValue: '臨時', 
            seqId: 4 
        }
    ]
    */
    /**
     * 
     * @param OnRaws If OnRaws != null, streaming receive, then return will be NULL
     */
    public async GetEnumFieldValue(condition: String, OnRaws?: OnRawsCallback): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.EnumFields, OnRaws, null, null, condition);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.EnumFields, condition);
    }

    /**
     *   personId: 30853,
         firstName: '',
         middleName: '',
         lastName: '黃吳意',
         engName: '離職刪除',
         employeeNo: '72721',
         cardNum: 0,
         fullCardNumber: 75096,
         pin: 165887807,
         deleted: false,
         lost: false,
         activationTime: 657388800,
         expirationTime: 870364740,
         updateTime: 885707145,
         updatedPerson: 3909 
     * @param condition Query string, e.g. lost=true and deleted=false
     * @param OnRaws If OnRaws != null, streaming receive, then return will be NULL
     */
    public async GetPerson(condition: String, OnRaws?: OnRawsCallback): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.Persons, OnRaws, null, null, condition);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.Persons, condition, 30000);
    }

    /**
     *  Note: Different kinds of field, value will put on one of charVal and decimalVal
     *  personId: 90846,
        fieldId: 1000000026,
        fieldName: '普查日期2',
        charVal: null,
        decimalVal: null
     * @param condition Query string, e.g. lost=true and deleted=false
     * @param OnRaws If OnRaws != null, streaming receive, then return will be NULL
     */
    public async GetPersonExtendInfo(condition: String, OnRaws?: OnRawsCallback): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.PersonExtendInfo, OnRaws, null, null, condition);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.PersonExtendInfo, condition, 30000);
    }

    /**
     *  fieldId: 1000000087, 
        value: '補發-損壞', 
        deleted: false 
     * @param condition Query string, e.g. lost=true and deleted=false
     * @param OnRaws If OnRaws != null, streaming receive, then return will be NULL
     */
    public async GetPersonExtendInfoEnumList(condition: String, OnRaws?: OnRawsCallback): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.PersonExtendInfoEnumList, OnRaws, null, null, condition);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.PersonExtendInfoEnumList, condition, 5000);
    }

    /**
     *  timespecId: 1620, 
        timespecName: '$預設的時間規格' 
     * @param condition Query string, e.g. timespecId=1620
     * @param OnRaws If OnRaws != null, streaming receive, then return will be NULL
     */
    public async GetTimeSchedules(condition: String, OnRaws?: OnRawsCallback): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.Timespec, OnRaws, null, null, condition);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.Timespec, condition);
    }

    /**
     *  timespecId: 32486,
        dayCode: 8,
        startTime: 34200,
        endTime: 61200 
     * @param condition Query string, e.g. dayCode=8
     * @param OnRaws If OnRaws != null, streaming receive, then return will be NULL
     */
    public async GetTimeScheduleDay(condition: String, OnRaws?: OnRawsCallback): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.TimespecDays, OnRaws, null, null, condition);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.TimespecDays, condition);
    }

    /**
     *   deviceId: 3405,
         deviceName: 'NHHQ_A2-2_R3_05G043',
         doorId: 4963,
         online: true,
         description: '' 
     * @param condition Query string, e.g. deviceId=3405
     * @param OnRaws If OnRaws != null, streaming receive, then return will be NULL
     */
    public async GetDevice(condition: String, OnRaws?: OnRawsCallback): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.Reader, OnRaws, null, null, condition);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.Reader, condition);
    }

    /**
     *   doorId: 4977,
         doorName: 'N1_NHHQ_C_06G073',
         Door_Has_RTE: false,
         Unlock_Door_on_RTE: true,
         Shunt_DSM_on_RTE: false,
         Continuously_Active: true,
         Relock_After_Open: true,
         Delay_Relock_Time: 0,
         unlockTime: 0,
         shuntTime: 0,
         description: '' 
     * @param condition Query string, e.g. Door_Has_RTE=false
     * @param OnRaws If OnRaws != null, streaming receive, then return will be NULL
     */
    public async GetDoor(condition: String, OnRaws?: OnRawsCallback): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.Doors, OnRaws, null, null, condition);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.Doors, condition);
    }

    /**
     *   floorId: 64359,
         floorName: 'S_KSMSC_D客梯 8F',
         online: true,
         description: '' 
     * @param condition Query string, e.g. floorId=64359
     * @param OnRaws If OnRaws != null, streaming receive, then return will be NULL
     */
    public async GetFloor(condition: String, OnRaws?: OnRawsCallback): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.Floor, OnRaws, null, null, condition);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.Floor, condition);
    }

    /**
     *   elevatorId: 2147483635,
         elevatorName: '$預設的電梯 (15162)',
         deviceId: null,
         online: false,
         description: '' 
     * @param condition Query string, e.g. deviceId=null
     * @param OnRaws If OnRaws != null, streaming receive, then return will be NULL
     */
    public async GetElevator(condition: String, OnRaws?: OnRawsCallback): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.Elevator, OnRaws, null, null, condition);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.Elevator, condition);
    }

    /**
    *   elevatorFloorId: 65198,
        elevatorId: 64313,
        floorId: 64359,
        deleted: false 
    * @param condition Query string, e.g. deleted=false
    * @param OnRaws If OnRaws != null, streaming receive, then return will be NULL
    */
    public async GetElevatorFloor(condition: String, OnRaws?: OnRawsCallback): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.ElevatorFloor, OnRaws, null, null, condition);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.ElevatorFloor, condition);
    }

    /**
     *   permissionTableId: 5604,
         permissionTableName: 'N1_NHHQ_6F-D22' 
     * @param condition Query string, e.g. permissionTableId=5604
     * @param OnRaws If OnRaws != null, streaming receive, then return will be NULL
     */
    public async GetPermissionTable(condition: String, OnRaws?: OnRawsCallback): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.Clearance, OnRaws, null, null, condition);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.Clearance, condition);
    }

    /**
     *   permissionTableId: 5028, 
         personId: 14775 
     * @param condition Query string, e.g. personId=14775
     * @param OnRaws If OnRaws != null, streaming receive, then return will be NULL
     */
    public async GetPermissionTablePerson(condition: String, OnRaws?: OnRawsCallback): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.ClearPerson, OnRaws, null, null, condition);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.ClearPerson, condition);
    }

    /**
     *   permissionTableId: 5182, 
         doorId: 5441, 
         timespecId: 5209 
     * @param condition Query string, e.g. timespecId=5209
     * @param OnRaws If OnRaws != null, streaming receive, then return will be NULL
     */
    public async GetPermissionTableDoor(condition: String, OnRaws?: OnRawsCallback): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.ClearDoor, OnRaws, null, null, condition);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.ClearDoor, condition);
    }

    /**
     *   permissionTableId: 5071, 
         groupId: 48632, 
         timespecId: 1682 
     * @param condition Query string, e.g. groupId=48632
     * @param OnRaws If OnRaws != null, streaming receive, then return will be NULL
     */
    public async GetPermissionTableElevatorFloor(condition: String, OnRaws?: OnRawsCallback): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.ClearElevatorFloor, OnRaws, null, null, condition);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.ClearElevatorFloor, condition);
    }

    /**
     *  permissionTableId: 42312,
        elevatorOrGroupId: 64313,
        floorOrGroupId: 64313,
        timespecId: 1682 
     * @param condition Query string, e.g. groupId=48632
     * @param OnRaws If OnRaws != null, streaming receive, then return will be NULL
     */
    public async GetPermissionTableDoorGroup(condition: String, OnRaws?: OnRawsCallback): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.ClearDoorGroup, OnRaws, null, null, condition);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.ClearDoorGroup, condition);
    }

    /**
     *   groupId: 10513, 
         groupName: 'DG_N2_PCMSC_IV-控制室-A8' 
     * @param condition Query string, e.g. groupId=10513
     * @param OnRaws If OnRaws != null, streaming receive, then return will be NULL
     */
    public async GetDoorGroup(condition: String, OnRaws?: OnRawsCallback): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.DoorGroup, OnRaws, null, null, condition);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.DoorGroup, condition);
    }

    /**
     *   groupId: 10513, 
         groupName: 'DG_N2_PCMSC_IV-控制室-A8' 
     * @param condition Query string, e.g. groupId=38005
     * @param OnRaws If OnRaws != null, streaming receive, then return will be NULL
     */
    public async GetFloorGroup(condition: String, OnRaws?: OnRawsCallback): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.FloorGroup, OnRaws, null, null, condition);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.FloorGroup, condition);
    }

    /**
     *   groupId: 65166, 
         groupName: 'EleG_S_KSMSC_A,B,C,D客梯' 
     * @param condition Query string, e.g. groupId=65166
     * @param OnRaws If OnRaws != null, streaming receive, then return will be NULL
     */
    public async GetElevatorGroup(condition: String, OnRaws?: OnRawsCallback): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.ElevatorGroup, OnRaws, null, null, condition);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.ElevatorGroup, condition);
    }

    /**
     *   groupId: 5484, 
         objectId: 4895 
     * @param condition Query string, e.g. groupId=5484
     * @param OnRaws If OnRaws != null, streaming receive, then return will be NULL
     */
    public async GetGroupMember(condition: String, OnRaws?: OnRawsCallback): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.GroupMember, OnRaws, null, null, condition);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.GroupMember, condition, 30000);
    }

    /**
     *   personId: 92626,
         userName: 'lydia lin',
         password: 'vHdUWL]qTEaua{~`',
         enabled: true,
         ODBCEnabled: true 
     * @param condition Query string, e.g. enabled=false
     * @param OnRaws If OnRaws != null, streaming receive, then return will be NULL
     */
    public async GetUser(condition: String, OnRaws?: OnRawsCallback): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.Users, OnRaws, null, null, condition);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.Users, condition);
    }

    /**
     *  objId: 1672,
        objName: '$所有 CCTV 交換器',
        isDeleted: false,
        objType: 45 
     * @param condition Query string, e.g. objId=1672
     * @param OnRaws If OnRaws != null, streaming receive, then return will be NULL
     */
    public async GetObject(condition: String, OnRaws?: OnRawsCallback): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.ObjectList, OnRaws, null, null, condition);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.ObjectList, condition, 30000);
    }
}
