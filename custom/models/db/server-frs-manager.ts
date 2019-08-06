import { registerSubclass } from 'helpers/parse-server/parse-helper';
import { ParseObjectNotice, IServerFRSUserGroup } from './_index';

/**
 * FRS 設定
 */
export interface IServerFRSManager {
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

    /**
     * User group in FRS
     */
    userGroups: IServerFRSUserGroup[];
}

@registerSubclass()
export class ServerFRSManager extends ParseObjectNotice<IServerFRSManager> {
    static notice$ = ParseObjectNotice._notice$.filter((x) => x.data.className === 'ServerFRSManager');
}
