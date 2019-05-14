import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';

/**
 * Eocorpex相機設定
 */
export interface IConfigEocorpexCamera {
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
export class ConfigEocorpexCamera extends ParseObject<IConfigEocorpexCamera> {}
