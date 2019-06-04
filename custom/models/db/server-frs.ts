import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import * as Rx from 'rxjs';

/**
 * FRS 設定
 */
export interface IServerFRS {
    /**
     * Custom id
     */
    customId: string;

    /**
     * 名稱
     */
    name: string;

    /**
     *
     */
    analysis: {
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
        wsport: number;

        /**
         *
         */
        account: string;

        /**
         *
         */
        password: string;
    };

    /**
     *
     */
    manage: {
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
    };
}

export let ServerFRS$: Rx.Subject<{ crud: 'c' | 'r' | 'u' | 'd' }> = new Rx.Subject();

@registerSubclass()
export class ServerFRS extends ParseObject<IServerFRS> {}
