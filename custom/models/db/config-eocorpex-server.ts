import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import * as Rx from 'rxjs';

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

export let ConfigEocorpexServer$: Rx.Subject<{ crud: 'c' | 'r' | 'u' | 'd' }> = new Rx.Subject();

@registerSubclass()
export class ConfigEocorpexServer extends ParseObject<IConfigEocorpexServer> {}
