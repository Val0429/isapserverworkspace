import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';

/**
 * CMS相機設定
 */
export interface IConfigCMSCamera {
    /**
     * 名稱
     */
    name: string;

    /**
     * NVR id
     */
    nvrId: number;

    /**
     * Channel id
     */
    channelId: number;
}

@registerSubclass()
export class ConfigCMSCamera extends ParseObject<IConfigCMSCamera> {}
