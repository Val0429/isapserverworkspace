import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';

/**
 * CMS相機設定
 */
export interface IConfigFRSCamera {
    /**
     *
     */
    sourceid: string;

    /**
     *
     */
    location: string;
}

@registerSubclass()
export class ConfigFRSCamera extends ParseObject<IConfigFRSCamera> {}
