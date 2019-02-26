import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import { IPackageBase } from '.';

/**
 * 寄放物品
 */
export interface IPackagePosting extends IPackageBase {
    /**
     * 寄件人照片
     */
    senderSrc: string;

    /**
     * 取件人照片
     */
    receiverSrc: string;

    /**
     * 物品照片
     */
    packageSrc: string;
}

@registerSubclass()
export class PackagePosting extends ParseObject<IPackagePosting> {}
