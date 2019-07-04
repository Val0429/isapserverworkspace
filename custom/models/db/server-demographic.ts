import { registerSubclass } from 'helpers/parse-server/parse-helper';
import { ParseObjectNotice } from './_index';

/**
 * Demographic 設定
 */
export interface IServerDemographic {
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
    margin: number;
}

@registerSubclass()
export class ServerDemographic extends ParseObjectNotice<IServerDemographic> {
    static notice$ = ParseObjectNotice._notice$.filter((x) => x.data.className === 'ServerDemographic');
}
