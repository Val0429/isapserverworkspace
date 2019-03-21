import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import { IPackageBase } from './_index';

/**
 * 郵件
 */
export interface IPackageReceive extends IPackageBase {
    /**
     * 條碼
     */
    barcode: string;
}

@registerSubclass()
export class PackageReceive extends ParseObject<IPackageReceive> {}
