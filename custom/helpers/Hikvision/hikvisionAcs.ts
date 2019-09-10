

import * as AcsDataStructure from  "./HikvisionAcsDef";
import * as EventEmitter from 'events'


let addon = require('./sdk/HikvisionAcsAddon');

export class Hikvision {
    private _instance;

    constructor() {
        this._instance = new addon.AcsGateWay();
    }
    public createInstance(data:AcsDataStructure.I_DeviceInfo) : AcsDataStructure.I_SdkResponse {
        return this._instance.createInstance(data);
    }
    
    public disposeInstance() : AcsDataStructure.I_SdkResponse  {
        return this._instance.disposeInstance();
    }

    public createCardItem(data:AcsDataStructure.I_CardParamCfg) : AcsDataStructure.I_SdkResponse {
        return this._instance.createCardItem(data);
    }
    
    public removeCardItem(data:string): AcsDataStructure.I_SdkResponse  {
        return this._instance.removeCardItem(data);
    }

    public enrollFace(data:AcsDataStructure.I_FaceParamCfg) : AcsDataStructure.I_SdkResponse  {
        return this._instance.enrollFace(data);
    }
    
    public removeFace(data:string): AcsDataStructure.I_SdkResponse  {
        return this._instance.removeFace(data);
    }

    public enableQrCode() : AcsDataStructure.I_SdkResponse  {
        return this._instance.enableQrCode();
    }

    public startArmingAcsEvent(data:EventEmitter): AcsDataStructure.I_SdkResponse {        
        return this._instance.startArmingAcsEvent(data.emit.bind(data));
    }
 
    public stopArmingAcsEvent() : AcsDataStructure.I_SdkResponse {
        return this._instance.stopArmingAcsEvent();
    }  
    
    public checkDeviceStatus(): AcsDataStructure.I_SdkResponse  {
        return this._instance.checkDeviceStatus();
    } 
}