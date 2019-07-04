import { registerSubclass } from 'helpers/parse-server/parse-helper';
import { ParseObjectNotice } from './_index';

/**
 * CMS 設定
 */
export interface IServerCMS {
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
export class ServerCMS extends ParseObjectNotice<IServerCMS> {
    static notice$ = ParseObjectNotice._notice$.filter((x) => x.data.className === 'ServerCMS');
}
