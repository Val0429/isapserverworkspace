import * as IConfig from './config';
import * as IGas from './gas';
import * as IManageCost from './managecost';
import * as IParking from './parking';
import * as IPackage from './package';
import * as IUser from './user';
import * as IVisitor from './visitor';

export { IConfig, IGas, IManageCost, IParking, IPackage, IUser, IVisitor };

export interface IDataList<T> {
    total: number;
    page: number;
    count: number;
    content: T;
}
