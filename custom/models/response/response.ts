import * as IConfig from './config';
import * as IManageCost from './managecost';
import * as IParking from './parking';
import * as IPackage from './package';
import * as IUser from './user';

export { IConfig, IManageCost, IParking, IPackage, IUser };

export interface IDataList<T> {
    total: number;
    page: number;
    count: number;
    content: T;
}
