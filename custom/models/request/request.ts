import * as IConfig from './config';
import * as IGas from './gas';
import * as IManageCost from './managecost';
import * as IParking from './parking';
import * as IPackage from './package';
import * as IUser from './user';

export { IConfig, IGas, IManageCost, IParking, IPackage, IUser };

export interface IDataList {
    page?: number;
    count?: number;
}
