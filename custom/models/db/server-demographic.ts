import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import * as Rx from 'rxjs';

/**
 * Demographic 設定
 */
export interface IServerDemographic {
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
    margin: number;
}

export let ServerDemographic$: Rx.Subject<{ crud: 'c' | 'r' | 'u' | 'd' }> = new Rx.Subject();

@registerSubclass()
export class ServerDemographic extends ParseObject<IServerDemographic> {}
