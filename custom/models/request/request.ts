import * as IConfig from './config';
import * as IGas from './gas';
import * as IManageCost from './managecost';
import * as IParking from './parking';
import * as IPublicArticle from './public-article';
import * as IPublicFacility from './public-facility';
import * as IPackage from './package';
import * as IUser from './user';
import * as IVisitor from './visitor';

export { IConfig, IGas, IManageCost, IParking, IPublicArticle, IPublicFacility, IPackage, IUser, IVisitor };

export interface IDataList {
    page?: number;
    count?: number;
}
