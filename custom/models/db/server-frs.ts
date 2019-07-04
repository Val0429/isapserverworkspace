import { registerSubclass } from 'helpers/parse-server/parse-helper';
import { ParseObjectNotice } from './_index';
import * as Enum from '../../enums';

/**
 * FRS User Group
 */
export interface IFRSUserGroup {
    /**
     *
     */
    type: Enum.EPeopleType;

    /**
     *
     */
    objectId: string;

    /**
     *
     */
    name: string;
}

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
    userGroups: IFRSUserGroup[];
}

@registerSubclass()
export class ServerFRS extends ParseObjectNotice<IServerFRS> {
    static notice$ = ParseObjectNotice._notice$.filter((x) => x.data.className === 'ServerFRS');
}
