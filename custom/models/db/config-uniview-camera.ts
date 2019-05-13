import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';

/**
 * UniView相機設定
 */
export interface IConfigUniviewCamera {
    /**
     *
     */
    protocol: 'http' | 'https';

    /**
     *
     */
    ip: string;

    /**
     *
     */
    port: number;

    /**
     *
     */
    account: string;

    /**
     *
     */
    password: string;
}

@registerSubclass()
export class ConfigUniviewCamera extends ParseObject<IConfigUniviewCamera> {}
