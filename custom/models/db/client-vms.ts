import { registerSubclass } from 'helpers/parse-server/parse-helper';
import { ParseObjectNotice, LocationFloors } from './_index';

/**
 * VMS 設定
 */
export interface IClientVMS {
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
export class ClientVMS extends ParseObjectNotice<IClientVMS> {
    static notice$ = ParseObjectNotice._notice$.filter((x) => x.data.className === 'ClientVMS');
}
