import * as ICommunity from './community';
import * as IConfig from './config';
import * as IGas from './gas';
import * as IListen from './listen';
import * as IManageCost from './managecost';
import * as IParking from './parking';
import * as IPublicArticle from './public-article';
import * as IPublicCalendar from './public-calendar';
import * as IPublicFacility from './public-facility';
import * as IPublicNotify from './public-notify';
import * as IPackage from './package';
import * as IUser from './user';
import * as IVisitor from './visitor';
import * as IVote from './vote';

export { ICommunity, IConfig, IGas, IListen, IManageCost, IParking, IPublicArticle, IPublicCalendar, IPublicFacility, IPublicNotify, IPackage, IUser, IVisitor, IVote };

export interface IDataList {
    page?: number;
    count?: number;
}
