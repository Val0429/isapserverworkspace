import {HRService} from './hr-service';
let hr = new HRService();
setTimeout(async () => {    
    await hr.doHumanResourcesSync();
}, 1000 * this.startDelayTime);

//export * from './acs-service';
//export * from './hr-service';
export * from './attendance-record';