import { registerSubclass } from 'helpers/parse-server/parse-helper';
import { ParseObjectNotice, IServerFRSUserGroup } from './_index';

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
    wsport: number;

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
export class ServerFRS extends ParseObjectNotice<IServerFRS> {
    static notice$ = ParseObjectNotice._notice$.filter((x) => x.data.className === 'ServerFRS');
}
