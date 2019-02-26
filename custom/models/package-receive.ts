import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import * as Enum from '../enums';
import { CharacterResident, IPackageBase } from '.';

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
