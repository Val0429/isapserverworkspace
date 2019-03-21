import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';

/**
 * 社區
 */
export interface ICommunity {
    /**
     * 社區名稱
     */
    name: string;

    /**
     * 社區地址
     */
    address: string;
}

@registerSubclass()
export class Community extends ParseObject<ICommunity> {}
