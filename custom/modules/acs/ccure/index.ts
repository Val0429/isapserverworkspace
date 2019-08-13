import { CCUREReader } from './CCUREReader'
import { QueryContent } from './queryMap'
import { SignalObject } from "./signalObject";
import { isNullOrUndefined } from 'util';
import { Config } from 'core/config.gen';

type OnRawsCallback = (rows: JSON[], queryContent: QueryContent) => void;
type OnDoneCallback = (result: JSON, queryContent: QueryContent) => void;

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
        if(this._reader)
        await this._reader.connectAsync(Config.CCUREconnect);
        this._signal.set(true);
    }

    //Disconnect to SQL server
    public async Logout() {
        this._signal.set(false);
        await this._reader.disconnectAsync();
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
    public async GetNewAccessReport(OnRaws?: OnRawsCallback, OnDone ?: OnDoneCallback ): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.ReportsNewUpdate, OnRaws, OnDone, null, null, true);
            return null;
        }
        else return this._reader.queryAllAsync(QueryContent.ReportsNewUpdate, null, true, 30000);
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
    public async GetAllAccessReport(OnRaws?: OnRawsCallback, OnDone ?: OnDoneCallback ): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.Reports, OnRaws, OnDone, null, null, true);
            return null;
        }
        else return this._reader.queryAllAsync(QueryContent.Reports, null, true, 30000);
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
    public async GetAllBadgeLayout(OnRaws?: OnRawsCallback, OnDone ?: OnDoneCallback ): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.BadgeLayout, OnRaws, OnDone, null, null, true);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.BadgeLayout, null, true, 5000);
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
    public async GetAllEnumFieldValue(OnRaws?: OnRawsCallback, OnDone ?: OnDoneCallback ): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.EnumFields, OnRaws, OnDone, null, null, true);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.EnumFields, null, true, 5000);
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
    public async GetAllPersons(OnRaws?: OnRawsCallback, OnDone ?: OnDoneCallback ): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            await this._reader.queryStreamAsync(QueryContent.Persons, OnRaws, OnDone, null, null, true);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.Persons, null, true, 1800000);
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
    public async GetAllPersonExtendInfo(OnRaws?: OnRawsCallback, OnDone ?: OnDoneCallback ): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.PersonExtendInfo, OnRaws, OnDone, null, null, true);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.PersonExtendInfo, null, true, 1800000);
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
    public async GetAllPersonExtendInfoEnumList(OnRaws?: OnRawsCallback, OnDone ?: OnDoneCallback ): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.PersonExtendInfoEnumList, OnRaws, OnDone, null, null, true);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.PersonExtendInfoEnumList, null, true, 5000);
    }

    /*
    [
        { 
            fieldId: 1000000055, 
            fieldName: 'leave_return_card' 
        },
        { 
            fieldId: 1000000056, 
            fieldName: 'take_card_his_no1' 
        }
    ]
    */
    /**
     * Note: Different kinds of field, value will put on one of charVal and decimalVal
     * @param OnRaws If OnRaws != null, streaming receive, then return will be NULL
     */
    public async GetAllPersonPropList(OnRaws?: OnRawsCallback, OnDone ?: OnDoneCallback ): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.PersonPropList, OnRaws, OnDone, null, null, true);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.PersonPropList, null, true, 5000);
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
    public async GetAllTimeSchedules(OnRaws?: OnRawsCallback, OnDone ?: OnDoneCallback ): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.Timespec, OnRaws, OnDone, null, null, true);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.Timespec, null, true);
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
    public async GetAllTimeScheduleDay(OnRaws?: OnRawsCallback, OnDone ?: OnDoneCallback ): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.TimespecDays, OnRaws, OnDone, null, null, true);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.TimespecDays, null, true);
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
    public async GetAllDevices(OnRaws?: OnRawsCallback, OnDone ?: OnDoneCallback ): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.Reader, OnRaws, OnDone, null, null, true);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.Reader, null, true);
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
    public async GetAllDoors(OnRaws?: OnRawsCallback, OnDone ?: OnDoneCallback ): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.Doors, OnRaws, OnDone, null, null, true);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.Doors, null, true);
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
    public async GetAllFloors(OnRaws?: OnRawsCallback, OnDone ?: OnDoneCallback ): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.Floor, OnRaws, OnDone, null, null, true);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.Floor, null, true);
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
    public async GetAllElevators(OnRaws?: OnRawsCallback, OnDone ?: OnDoneCallback ): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.Elevator, OnRaws, OnDone, null, null, true);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.Elevator, null, true);
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
    public async GetAllElevatorFloor(OnRaws?: OnRawsCallback, OnDone ?: OnDoneCallback ): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.ElevatorFloor, OnRaws, OnDone, null, null, true);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.ElevatorFloor, null, true);
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
    public async GetAllPermissionTables(OnRaws?: OnRawsCallback, OnDone ?: OnDoneCallback ): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.Clearance, OnRaws, OnDone, null, null, true);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.Clearance, null, true);
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
    public async GetAllPermissionTablePerson(OnRaws?: OnRawsCallback, OnDone ?: OnDoneCallback ): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.ClearPerson, OnRaws, OnDone, null, null, true);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.ClearPerson, null, true);
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
    public async GetAllPermissionTableDoor(OnRaws?: OnRawsCallback, OnDone ?: OnDoneCallback ): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.ClearDoor, OnRaws, OnDone, null, null, true);
            return null;
        }
        return await this._reader.queryAllAsync(QueryContent.ClearDoor, null, true);
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
    public async GetAllPermissionTableDoorGroup(OnRaws?: OnRawsCallback, OnDone ?: OnDoneCallback ): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.ClearDoorGroup, OnRaws, OnDone, null, null, true);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.ClearDoorGroup, null, true);
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
    public async GetAllPermissionTableElevatorFloor(OnRaws?: OnRawsCallback, OnDone ?: OnDoneCallback ): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.ClearElevatorFloor, OnRaws, OnDone, null, null, true);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.ClearElevatorFloor, null, true);
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
    public async GetAllDoorGroup(OnRaws?: OnRawsCallback, OnDone ?: OnDoneCallback ): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.DoorGroup, OnRaws, OnDone, null, null, true);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.DoorGroup, null, true);
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
    public async GetAllFloorGroup(OnRaws?: OnRawsCallback, OnDone ?: OnDoneCallback ): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.FloorGroup, OnRaws, OnDone, null, null, true);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.FloorGroup, null, true);
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
    public async GetAllElevatorGroup(OnRaws?: OnRawsCallback, OnDone ?: OnDoneCallback ): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.ElevatorGroup, OnRaws, OnDone, null, null, true);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.ElevatorGroup, null, true);
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
    public async GetAllGroupMember(OnRaws?: OnRawsCallback, OnDone ?: OnDoneCallback ): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.GroupMember, OnRaws, OnDone, null, null, true);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.GroupMember, null, true, 30000);
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
    public async GetAllUsers(OnRaws?: OnRawsCallback, OnDone ?: OnDoneCallback ): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.Users, OnRaws, OnDone, null, null, true);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.Users, null, true);
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
    public async GetAllObjects(OnRaws?: OnRawsCallback, OnDone ?: OnDoneCallback ): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.ObjectList, OnRaws, OnDone, null, null, true);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.ObjectList, null, true, 30000);
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
    public async GetAccessReport(condition: String, OnRaws?: OnRawsCallback, OnDone ?: OnDoneCallback ): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.Reports, OnRaws, OnDone, null, condition, true);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.Reports, condition, true, 30000);
    }

    /**
     *   badgeLayoutId: 154135, 
         badgeLayoutName: 'Security-01'  
     * @param condition Query string, e.g. lost=true and deleted=false
     * @param OnRaws If OnRaws != null, streaming receive, then return will be NULL
     */
    public async GetBadgeLayout(condition: String, OnRaws?: OnRawsCallback, OnDone ?: OnDoneCallback ): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.BadgeLayout, OnRaws, OnDone, null, condition, true);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.BadgeLayout, condition, true, 30000);
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
    public async GetEnumFieldValue(condition: String, OnRaws?: OnRawsCallback, OnDone ?: OnDoneCallback ): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.EnumFields, OnRaws, OnDone, null, condition, true);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.EnumFields, condition, true);
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
    public async GetPerson(condition: String, OnRaws?: OnRawsCallback, OnDone ?: OnDoneCallback ): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.Persons, OnRaws, OnDone, null, condition, true);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.Persons, condition, true, 30000);
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
    public async GetPersonExtendInfo(condition: String, OnRaws?: OnRawsCallback, OnDone ?: OnDoneCallback ): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.PersonExtendInfo, OnRaws, OnDone, null, condition, true);
            return null;
        }
        let result = await this._reader.queryAllAsync(QueryContent.PersonExtendInfo, condition, true, 30000);
        return result;
    }

    /**
     *  fieldId: 1000000087, 
        value: '補發-損壞', 
        deleted: false 
     * @param condition Query string, e.g. lost=true and deleted=false
     * @param OnRaws If OnRaws != null, streaming receive, then return will be NULL
     */
    public async GetPersonExtendInfoEnumList(condition: String, OnRaws?: OnRawsCallback, OnDone ?: OnDoneCallback ): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.PersonExtendInfoEnumList, OnRaws, OnDone, null, condition, true);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.PersonExtendInfoEnumList, condition, true, 5000);
    }

    /*
    [
        { 
            fieldId: 1000000055, 
            fieldName: 'leave_return_card' 
        },
        { 
            fieldId: 1000000056, 
            fieldName: 'take_card_his_no1' 
        }
    ]
    */
  /**
        fieldId: 1000000087, 
        fieldName: 'leave_return_card' 
     * @param condition Query string, e.g. lost=true and deleted=false
     * @param OnRaws If OnRaws != null, streaming receive, then return will be NULL
     */
    public async GetPersonPropList(condition: String, OnRaws?: OnRawsCallback, OnDone ?: OnDoneCallback ): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.PersonPropList, OnRaws, OnDone, null, condition, true);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.PersonPropList, condition, true, 5000);
    }

    /**
     *  timespecId: 1620, 
        timespecName: '$預設的時間規格' 
     * @param condition Query string, e.g. timespecId=1620
     * @param OnRaws If OnRaws != null, streaming receive, then return will be NULL
     */
    public async GetTimeSchedules(condition: String, OnRaws?: OnRawsCallback, OnDone ?: OnDoneCallback ): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.Timespec, OnRaws, OnDone, null, condition, true);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.Timespec, condition, true);
    }

    /**
     *  timespecId: 32486,
        dayCode: 8,
        startTime: 34200,
        endTime: 61200 
     * @param condition Query string, e.g. dayCode=8
     * @param OnRaws If OnRaws != null, streaming receive, then return will be NULL
     */
    public async GetTimeScheduleDay(condition: String, OnRaws?: OnRawsCallback, OnDone ?: OnDoneCallback ): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.TimespecDays, OnRaws, OnDone, null, condition, true);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.TimespecDays, condition, true);
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
    public async GetDevice(condition: String, OnRaws?: OnRawsCallback, OnDone ?: OnDoneCallback ): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.Reader, OnRaws, OnDone, null, condition, true);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.Reader, condition, true);
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
    public async GetDoor(condition: String, OnRaws?: OnRawsCallback, OnDone ?: OnDoneCallback ): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.Doors, OnRaws, OnDone, null, condition, true);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.Doors, condition, true);
    }

    /**
     *   floorId: 64359,
         floorName: 'S_KSMSC_D客梯 8F',
         online: true,
         description: '' 
     * @param condition Query string, e.g. floorId=64359
     * @param OnRaws If OnRaws != null, streaming receive, then return will be NULL
     */
    public async GetFloor(condition: String, OnRaws?: OnRawsCallback, OnDone ?: OnDoneCallback ): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.Floor, OnRaws, OnDone, null, condition, true);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.Floor, condition, true);
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
    public async GetElevator(condition: String, OnRaws?: OnRawsCallback, OnDone ?: OnDoneCallback ): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.Elevator, OnRaws, OnDone, null, condition, true);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.Elevator, condition, true);
    }

    /**
    *   elevatorFloorId: 65198,
        elevatorId: 64313,
        floorId: 64359,
        deleted: false 
    * @param condition Query string, e.g. deleted=false
    * @param OnRaws If OnRaws != null, streaming receive, then return will be NULL
    */
    public async GetElevatorFloor(condition: String, OnRaws?: OnRawsCallback, OnDone ?: OnDoneCallback ): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.ElevatorFloor, OnRaws, OnDone, null, condition, true);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.ElevatorFloor, condition, true);
    }

    /**
     *   permissionTableId: 5604,
         permissionTableName: 'N1_NHHQ_6F-D22' 
     * @param condition Query string, e.g. permissionTableId=5604
     * @param OnRaws If OnRaws != null, streaming receive, then return will be NULL
     */
    public async GetPermissionTable(condition: String, OnRaws?: OnRawsCallback, OnDone ?: OnDoneCallback ): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.Clearance, OnRaws, OnDone, null, condition, true);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.Clearance, condition, true);
    }

    /**
     *   permissionTableId: 5028, 
         personId: 14775 
     * @param condition Query string, e.g. personId=14775
     * @param OnRaws If OnRaws != null, streaming receive, then return will be NULL
     */
    public async GetPermissionTablePerson(condition: String, OnRaws?: OnRawsCallback, OnDone ?: OnDoneCallback ): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.ClearPerson, OnRaws, OnDone, null, condition, true);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.ClearPerson, condition, true);
    }

    /**
     *   permissionTableId: 5182, 
         doorId: 5441, 
         timespecId: 5209 
     * @param condition Query string, e.g. timespecId=5209
     * @param OnRaws If OnRaws != null, streaming receive, then return will be NULL
     */
    public async GetPermissionTableDoor(condition: String, OnRaws?: OnRawsCallback, OnDone ?: OnDoneCallback ): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.ClearDoor, OnRaws, OnDone, null, condition, true);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.ClearDoor, condition, true);
    }

    /**
     *   permissionTableId: 5071, 
         groupId: 48632, 
         timespecId: 1682 
     * @param condition Query string, e.g. groupId=48632
     * @param OnRaws If OnRaws != null, streaming receive, then return will be NULL
     */
    public async GetPermissionTableElevatorFloor(condition: String, OnRaws?: OnRawsCallback, OnDone ?: OnDoneCallback ): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.ClearElevatorFloor, OnRaws, OnDone, null, condition, true);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.ClearElevatorFloor, condition, true);
    }

    /**
     *  permissionTableId: 42312,
        elevatorOrGroupId: 64313,
        floorOrGroupId: 64313,
        timespecId: 1682 
     * @param condition Query string, e.g. groupId=48632
     * @param OnRaws If OnRaws != null, streaming receive, then return will be NULL
     */
    public async GetPermissionTableDoorGroup(condition: String, OnRaws?: OnRawsCallback, OnDone ?: OnDoneCallback ): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.ClearDoorGroup, OnRaws, OnDone, null, condition, true);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.ClearDoorGroup, condition, true);
    }

    /**
     *   groupId: 10513, 
         groupName: 'DG_N2_PCMSC_IV-控制室-A8' 
     * @param condition Query string, e.g. groupId=10513
     * @param OnRaws If OnRaws != null, streaming receive, then return will be NULL
     */
    public async GetDoorGroup(condition: String, OnRaws?: OnRawsCallback, OnDone ?: OnDoneCallback ): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.DoorGroup, OnRaws, OnDone, null, condition, true);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.DoorGroup, condition, true);
    }

    /**
     *   groupId: 10513, 
         groupName: 'DG_N2_PCMSC_IV-控制室-A8' 
     * @param condition Query string, e.g. groupId=38005
     * @param OnRaws If OnRaws != null, streaming receive, then return will be NULL
     */
    public async GetFloorGroup(condition: String, OnRaws?: OnRawsCallback, OnDone ?: OnDoneCallback ): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.FloorGroup, OnRaws, OnDone, null, condition, true);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.FloorGroup, condition, true);
    }

    /**
     *   groupId: 65166, 
         groupName: 'EleG_S_KSMSC_A,B,C,D客梯' 
     * @param condition Query string, e.g. groupId=65166
     * @param OnRaws If OnRaws != null, streaming receive, then return will be NULL
     */
    public async GetElevatorGroup(condition: String, OnRaws?: OnRawsCallback, OnDone ?: OnDoneCallback ): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.ElevatorGroup, OnRaws, OnDone, null, condition, true);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.ElevatorGroup, condition, true);
    }

    /**
     *   groupId: 5484, 
         objectId: 4895 
     * @param condition Query string, e.g. groupId=5484
     * @param OnRaws If OnRaws != null, streaming receive, then return will be NULL
     */
    public async GetGroupMember(condition: String, OnRaws?: OnRawsCallback, OnDone ?: OnDoneCallback ): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.GroupMember, OnRaws, OnDone, null, condition, true);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.GroupMember, condition, true, 30000);
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
    public async GetUser(condition: String, OnRaws?: OnRawsCallback, OnDone ?: OnDoneCallback ): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.Users, OnRaws, OnDone, null, condition, true);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.Users, condition, true);
    }

    /**
     *  objId: 1672,
        objName: '$所有 CCTV 交換器',
        isDeleted: false,
        objType: 45 
     * @param condition Query string, e.g. objId=1672
     * @param OnRaws If OnRaws != null, streaming receive, then return will be NULL
     */
    public async GetObject(condition: String, OnRaws?: OnRawsCallback, OnDone ?: OnDoneCallback ): Promise<JSON[]> {
        await this._signal.wait(this._waitTime, x => x);
        if (isNullOrUndefined(OnRaws) == false) {
            this._reader.queryStreamAsync(QueryContent.ObjectList, OnRaws, OnDone, null, condition, true);
            return null;
        }
        return this._reader.queryAllAsync(QueryContent.ObjectList, condition, true, 30000);
    }

    public async GetAllOrganizedDoorGroup(OnRaws?: OnRawsCallback, OnDone ?: OnDoneCallback ) {

        let doors = await this.GetAllDoors();
        let doorGroups = await this.GetAllDoorGroup();
        let groupMember = await this.GetAllGroupMember();
        
        let doorKeyMap = GetKeyMap(doors,"doorId", "doorName");
        let doorGroupKeyMap = GetKeyMap(doorGroups,"groupId", "groupName");

        var jsonata = require("jsonata");
        let groupMemberGroupby : JSON = await jsonata("{$string(`groupId`): $ }").evaluate(groupMember);

        NormalizeJSON(groupMemberGroupby);

        let result = [];

        for(var i = 0 ; i < doorGroups.length ; i++){
            let groupId : string = doorGroups[i]["groupId"];
            if(!groupMemberGroupby[groupId]) continue;
            let doorArr = [];
            for(var j = 0 ; j < groupMemberGroupby[groupId].length ; j++){
                let doorId = groupMemberGroupby[groupId][j]["objectId"];
                doorArr.push({
                    "doorId":doorId,
                    "doorName":doorKeyMap[doorId]
                });
            }
            result.push({
                "groupId":groupId,
                "groupName":doorGroupKeyMap[groupId],
                "doors":doorArr
            });
        }

        return result;
    }

    public async GetAllOrganizedFloorGroup(OnRaws?: OnRawsCallback, OnDone ?: OnDoneCallback ) {

        let floors = await this.GetAllFloors();
        let floorGroups = await this.GetAllFloorGroup();
        let groupMember = await this.GetAllGroupMember();
        
        let floorsKeyMap = GetKeyMap(floors,"floorId", "floorName");
        let floorGroupsKeyMap = GetKeyMap(floorGroups,"groupId", "groupName");

        var jsonata = require("jsonata");
        let groupMemberGroupby : JSON = await jsonata("{$string(`groupId`): $ }").evaluate(groupMember);

        NormalizeJSON(groupMemberGroupby);

        let result = [];

        for(var i = 0 ; i < floorGroups.length ; i++){
            let groupId : string = floorGroups[i]["groupId"];
            if(!groupMemberGroupby[groupId]) continue;
            let floorArr = [];
            for(var j = 0 ; j < groupMemberGroupby[groupId].length ; j++){
                let floorId = groupMemberGroupby[groupId][j]["objectId"];
                floorArr.push({
                    "floorId":floorId,
                    "floorName":floorsKeyMap[floorId]
                });
            }
            result.push({
                "groupId":groupId,
                "groupName":floorGroupsKeyMap[groupId],
                "floors":floorArr
            });
        }

        return result;
    }

    public async GetAllOrganizedElevatorGroup(OnRaws?: OnRawsCallback, OnDone ?: OnDoneCallback ) {

        let elevators = await this.GetAllElevators();
        let elevatorGroups = await this.GetAllElevatorGroup();
        let groupMember = await this.GetAllGroupMember();
        
        let elevatorsKeyMap = GetKeyMap(elevators,"elevatorId", "elevatorName");
        let elevatorGroupsKeyMap = GetKeyMap(elevatorGroups,"groupId", "groupName");

        var jsonata = require("jsonata");
        let groupMemberGroupby : JSON = await jsonata("{$string(`groupId`): $ }").evaluate(groupMember);

        NormalizeJSON(groupMemberGroupby);

        let result = [];

        for(var i = 0 ; i < elevatorGroups.length ; i++){
            let groupId : string = elevatorGroups[i]["groupId"];
            if(!groupMemberGroupby[groupId]) continue;
            let elevatorArr = [];
            for(var j = 0 ; j < groupMemberGroupby[groupId].length ; j++){
                let elevatorId = groupMemberGroupby[groupId][j]["objectId"];
                elevatorArr.push({
                    "elevatorId":elevatorId,
                    "elevatorName":elevatorsKeyMap[elevatorId]
                });
            }
            result.push({
                "groupId":groupId,
                "groupName":elevatorGroupsKeyMap[groupId],
                "elevators":elevatorArr
            });
        }

        return result;
    }

    public async GetAllOrganizedElevatorFloor(OnRaws?: OnRawsCallback, OnDone ?: OnDoneCallback ) {

        let groupMember = await this.GetAllGroupMember();
        let elevators = await this.GetAllElevators();
        let elevatorGroups = await this.GetAllElevatorGroup();
        let floors = await this.GetAllFloors();
        let floorGroups = await this.GetAllFloorGroup();
        let elevatorFloors = await this.GetAllElevatorFloor();

        let floorsKeyMap = GetKeyMap(floors,"floorId", "floorName");
        let elevatorsKeyMap = GetKeyMap(elevators,"elevatorId", "elevatorName");
        let elevatorGroupsKeyMap = GetKeyMap(elevatorGroups,"groupId", "groupName");
        let floorGroupsKeyMap = GetKeyMap(floorGroups,"groupId", "groupName");

        var jsonata = require("jsonata");
        let elevatorFloorsGroupby : JSON = await jsonata("{$string(`elevatorId`): $ }").evaluate(elevatorFloors);

        NormalizeJSON(elevatorFloorsGroupby);

        let result = [];
        
        Object.keys(elevatorFloorsGroupby).forEach(function(elevatorId){
            let floorArr = [];
            for (let index = 0; index < elevatorFloorsGroupby[elevatorId].length; index++) {
                const element = elevatorFloorsGroupby[elevatorId][index];
                console.log(element);
                floorArr.push({
                    "floorId":element["floorId"],
                    "floorName":floorsKeyMap[element["floorId"]]
                })
            }
            result.push({
                "elevatorId":elevatorId,
                "elevatorName":elevatorsKeyMap[elevatorId],
                "floors":floorArr
            });
        });


        return result;
    }
}

function GetKeyMap(jsons: JSON[], keyIDName : string, valueName : string) : Map<number,string>{
    let result = new Map();
    for(var i = 0 ; i < jsons.length ; i++){
        result[jsons[i][keyIDName]] = jsons[i][valueName];
    }
    return result;
}

function NormalizeJSON(obj){
    Object.keys(obj).forEach(function(k){
        if(isNullOrUndefined(obj[k].length) == true){
            let arr = []
            arr.push(obj[k]);
            obj[k] = arr;
        }
    });
}