import { Config } from 'core/config.gen';

import { Log } from 'helpers/utility';

import { CCUREReader } from '../../modules/acs/ccure/ccureReader';
import { QueryContent } from '../../modules/acs/ccure/queryMap'
import { SignalObject } from "../../modules/acs/ccure/signalObject";

import { isNullOrUndefined } from 'util';

type OnRawsCallback = (rows: JSON[], queryContent: QueryContent) => void;

interface IdNameMap {
    [key: number]: string;
}

export class CCureAdapter {
    //Wait for connected time (ms)
    protected _waitTime: number = 5000;

    // Reader Instance
    protected _reader: CCUREReader = null;

    //Singal Object, use to wait for connected, default set to this._waitTime ms
    protected _signal: SignalObject = null;

    protected _idNameMap: IdNameMap = {};


    constructor() {
        Log.Info(`${this.constructor.name}`, `constructor`);

        var me = this;

        this._reader = CCUREReader.getInstance();
        this._signal = new SignalObject(false);

        (async () => {
            await this.Login();
        })();
    }

    async getRecords() {
        await this._signal.wait(this._waitTime, x => x);
        let records = this._reader.queryAllAsync(QueryContent.Reports, null, 30000);

        // [
        //     { 
        //         reportId: 10000001090,
        //         personId: null,
        //         personName: '證卡 #35798',
        //         cardNum: 35798,
        //         doorId: '2087',
        //         doorName: 'D001',
        //         apcId: '2076',
        //         apcName: 'Apc#01 MS:1 R1',
        //         messageCode: 1003,
        //         message: '在 D001 [入] [場區代碼]  拒絕 證卡 #35798',
        //         updateTime: 2008-04-18T14:03:49.000Z 
        //     }
        // ]

        //   * IF [messageCode]==1002 : 人-卡:核可進入
        //   * IF [messageCode]==1003 : 人-卡:拒絕進入

        return records;
    }

    async Login() {
        Log.Info(`${this.constructor.name}`, `Login`);

        await this._reader.connectAsync();
        this._signal.set(true);

        return "";
    }

    async getTimeSchedule() {
        Log.Info(`${this.constructor.name}`, `getTimeSchedule`);

        await this._signal.wait(this._waitTime, x => x);
        let records = await this._reader.queryAllAsync(QueryContent.Timespec);

        // console.log(records);
        /*
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
        return records;
    }

    async getReaders() {
        Log.Info(`${this.constructor.name}`, `getReaders`);

        await this._signal.wait(this._waitTime, x => x);
        let records = await this._reader.queryAllAsync(QueryContent.Reader);

        // console.log(records);
        // [ 
        //     { 
        //         deviceId: 3404,
        //         deviceName: 'NHHQ_A2-2_R2_05G042',
        //         doorId: 4962,
        //         online: false,
        //         description: '' 
        //     },
        //     { 
        //         deviceId: 3405,
        //         deviceName: 'NHHQ_A2-2_R3_05G043',
        //         doorId: 4963,
        //         online: true,
        //         description: '' 
        //     }
        // ]
        return records;
    }

    async getDoors() {
        Log.Info(`${this.constructor.name}`, `getDoors`);

        await this._signal.wait(this._waitTime, x => x);
        let records = await this._reader.queryAllAsync(QueryContent.Doors);

        // console.log(records);
        // [ 
        //     { 
        //         doorId: 4976,
        //         doorName: 'N1_NHHQ_C_06G072',
        //         Door_Has_RTE: true,
        //         Unlock_Door_on_RTE: true,
        //         Shunt_DSM_on_RTE: true,
        //         Continuously_Active: true,
        //         Relock_After_Open: true,
        //         Delay_Relock_Time: 0,
        //         unlockTime: 5,
        //         shuntTime: 30,
        //         description: '' 
        //     },
        //     { 
        //         doorId: 4977,
        //         doorName: 'N1_NHHQ_C_06G073',
        //         Door_Has_RTE: false,
        //         Unlock_Door_on_RTE: true,
        //         Shunt_DSM_on_RTE: false,
        //         Continuously_Active: true,
        //         Relock_After_Open: true,
        //         Delay_Relock_Time: 0,
        //         unlockTime: 0,
        //         shuntTime: 0,
        //         description: '' 
        //     }
        // ]
        return records;
    }

    async getDoorGroups() {
        Log.Info(`${this.constructor.name}`, `getDoorGroups`);

        await this._signal.wait(this._waitTime, x => x);
        let records = await this._reader.queryAllAsync(QueryContent.DoorGroup);

        return records;

        // { 
        //     floorId: 64358,
        //     floorName: 'S_KSMSC_D客梯 7F',
        //     online: true,
        //     description: '' 
        // },
        // { 
        //     floorId: 64359,
        //     floorName: 'S_KSMSC_D客梯 8F',
        //     online: true,
        //     description: '' 
        // }

    }

    async getFloors() {
        Log.Info(`${this.constructor.name}`, `getFloors`);

        await this._signal.wait(this._waitTime, x => x);
        let records = await this._reader.queryAllAsync(QueryContent.Floor);

        return records;


        // [
        //     { 
        //         floorId: 64358,
        //         floorName: 'S_KSMSC_D客梯 7F',
        //         online: true,
        //         description: '' 
        //     },
        //     { 
        //         floorId: 64359,
        //         floorName: 'S_KSMSC_D客梯 8F',
        //         online: true,
        //         description: '' 
        //     }
        // ]

    }

    async getElevators() {
        Log.Info(`${this.constructor.name}`, `getElevators`);

        await this._signal.wait(this._waitTime, x => x);
        let records = await this._reader.queryAllAsync(QueryContent.Elevator);
        return records;

        // { 
        //     elevatorId: 64316,
        //     elevatorName: 'S_KSMSC_S_10G00A',
        //     deviceId: 64283,
        //     online: true,
        //     description: 'KaoHsiung MSC A客梯' 
        // },
        // { 
        //     elevatorId: 2147483635,
        //     elevatorName: '$預設的電梯 (15162)',
        //     deviceId: null,
        //     online: false,
        //     description: '' 
        // }
    }

    async getCardHolderList() {
        Log.Info(`${this.constructor.name}`, `getCardHolderList`);

        await this._signal.wait(this._waitTime, x => x);
        let records = await this._reader.queryAllAsync(QueryContent.Persons, null, 30000);

        // console.log(records);
        // [
        //     {   
        //         personId: 30853,
        //         firstName: '',
        //         middleName: '',
        //         lastName: '黃吳意',
        //         engName: '離職刪除',
        //         employeeNo: '72721',
        //         cardNum: 0,
        //         fullCardNumber: 75096,
        //         pin: 165887807,
        //         deleted: false,
        //         lost: false,
        //         activationTime: 657388800,
        //         expirationTime: 870364740,
        //         updateTime: 885707145,
        //         updatedPerson: 3909 
        //     }
        // ]

        return records;
    }

    async getPermissionTables() {
        Log.Info(`${this.constructor.name}`, `getPermissionTable`);

        await this._signal.wait(this._waitTime, x => x);
        let records = await this._reader.queryAllAsync(QueryContent.Clearance, null, 30000);

        // { 
        //     permissionTableId: 5205,
        //     permissionTableName: 'C_Nantou-HUB-ALL' 
        // },
        // { 
        //     permissionTableId: 5604,
        //     permissionTableName: 'N1_NHHQ_6F-D22' 
        // }

        return records;
    }
}

// export default new SiPassAdapter();