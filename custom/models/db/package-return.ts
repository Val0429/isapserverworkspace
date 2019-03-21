import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import { IPackageReceive } from './_index';

/**
 * 退件
 */
export interface IPackageReturn extends IPackageReceive {
    /**
     * 退貨人照片
     */
    receiverSrc: string;
}

@registerSubclass()
export class PackageReturn extends ParseObject<IPackageReturn> {}
