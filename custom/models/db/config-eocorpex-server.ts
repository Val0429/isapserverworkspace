import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';

/**
 * Eocorpex設定
 */
export interface IConfigEocorpexServer {
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
export class ConfigEocorpexServer extends ParseObject<IConfigEocorpexServer> {}
