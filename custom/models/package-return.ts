import { registerSubclass, ParseObject } from 'helpers/parse-server/parse-helper';
import { IPackageReceive } from '.';

/**
 * 退件
 */
export interface IPackageReturn extends IPackageReceive {}

@registerSubclass()
export class PackageReturn extends ParseObject<IPackageReturn> {}
