import { registerSubclass } from 'helpers/parse-server/parse-helper';
import { ParseObjectNotice, LocationFloors } from './_index';

/**
 * HikVision 設定
 */
export interface IClientHikVision {
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
export class ClientHikVision extends ParseObjectNotice<IClientHikVision> {
    static notice$ = ParseObjectNotice._notice$.filter((x) => x.data.className === 'ClientHikVision');
}
