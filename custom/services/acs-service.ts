import { Log } from 'helpers/utility';
import {SyncService} from './SyncService';

export class ACSService {
    private waitTimer = null;
    private startDelayTime: number = 5 // sec
    private cycleTime: number = 1200; // sec
    private syncService:SyncService;
    constructor() {
        this.syncService = new SyncService();
        this.startSync();
        // 1.0 Login to Datebase
        Log.Info(`${this.constructor.name}`, `1.0 Login database connection`);
        // (async () => {
        this.waitTimer = setTimeout(async () => {
            this.doAccessControlSync();
        }, 1000 * this.startDelayTime);
        // })();
    }

    async doAccessControlSync() {
        Log.Info(`${this.constructor.name}`, `2.0 Timer Check`);

        let now: Date = new Date();

        clearTimeout(this.waitTimer);
        this.cycleTime = 1200;

        if (this.cycleTime != 5) {
            if ((now.getHours() == 0) && (now.getMinutes() == 0)) {  // Startup @00:00
                // if (now.getMinutes() != 70) {
                // 0.0 Initial Adapter
                Log.Info(`${this.constructor.name}`, `0.0 Initial Adapter`);
                await this.startSync();
            }
        }

        now = new Date();
        var s = (now.getMinutes() * 60 + now.getSeconds()) % this.cycleTime;
        Log.Info(`${this.constructor.name}`, `Timer Check wait for [ ${this.cycleTime - s} ] sec`);

        this.waitTimer = setTimeout(() => {
            this.doAccessControlSync();
        }, (this.cycleTime - s) * 1000);
    }

    private async startSync() {
        let me = this;
        await new Promise(async function (resolve, reject) {
            await me.syncService.syncSipassSchedule();
            resolve();
        });

 
        await this.syncService.syncSipassDoorReader();
        await this.syncService.syncSipassFloor();
        //await this.syncService.syncSipassAcessGroup();
        await this.syncService.syncSipassWorkgroup();
        await this.syncService.syncSipassCredentialProfile();

        await this.syncService.syncCcureTimeSchedule();
        await this.syncService.syncCcureDoor();
        await this.syncService.syncCcureDoorReader();
        await this.syncService.syncCcureFloor();
        await this.syncService.syncCcurePermissionTable();
        await this.syncService.syncCcurePermissionTableDoor() ;
 
    }

    
}

export default new ACSService();