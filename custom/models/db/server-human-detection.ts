import { registerSubclass } from 'helpers/parse-server/parse-helper';
import { ParseObjectNotice } from './_index';

/**
 * Demographic 設定
 */
export interface IServerHumanDetection {
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
    target_score: number;
}

@registerSubclass()
export class ServerHumanDetection extends ParseObjectNotice<IServerHumanDetection> {
    static notice$ = ParseObjectNotice._notice$.filter((x) => x.data.className === 'ServerHumanDetection');
}
