

import * as AcsDataStructure from  "./HikvisionAcsDef";
import * as EventEmitter from 'events'


let addon = require('./sdk/HikvisionAcsAddon');

export class Hikvision {
    private _instance;

    constructor() {
        this._instance = new addon.AcsGateWay();
    }
    public createInstance(data:AcsDataStructure.I_DeviceInfo) {
        return this._instance.createInstance(data);
    }
    
    public disposeInstance() {
        return this._instance.disposeInstance();
    }

    public createCardItem(data:AcsDataStructure.I_CardParamCfg) {
        return this._instance.createCardItem(data);
    }
    
    public removeCardItem(data:string) {
        return this._instance.removeCardItem(data);
    }

    public enrollFace(data:AcsDataStructure.I_FaceParamCfg) {
        return this._instance.enrollFace(data);
    }
    
    public removeFace(data:string) {
        return this._instance.removeFace(data);
    }

    public enableQrCode() {
        return this._instance.enableQrCode();
    }

    public startArmingAcsEvent(data:EventEmitter) {        
        return this._instance.startArmingAcsEvent(data.emit.bind(data));
    }
 
    public stopArmingAcsEvent() {
        return this._instance.stopArmingAcsEvent();
    }  
    
    public checkDeviceStatus() {
        return this._instance.checkDeviceStatus();
    } 
}