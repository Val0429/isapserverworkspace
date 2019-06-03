import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import * as Rx from 'rxjs';

/**
 * CMS 設定
 */
export interface IServerCMS {
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

export let ServerCMS$: Rx.Subject<{ crud: 'c' | 'r' | 'u' | 'd' }> = new Rx.Subject();

@registerSubclass()
export class ServerCMS extends ParseObject<IServerCMS> {}
