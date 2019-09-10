import { registerSubclass } from 'helpers/parse-server/parse-helper';
import { ParseObjectNotice, LocationFloors } from './_index';

/**
 * FRS 設定
 */
export interface IClientFRS {
    /**
     *
     */
    floor: LocationFloors;

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
export class ClientFRS extends ParseObjectNotice<IClientFRS> {
    static notice$ = ParseObjectNotice._notice$.filter((x) => x.data.className === 'ClientFRS');
}
