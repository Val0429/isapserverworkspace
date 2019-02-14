import * as IConfig from './config';
import * as IPrinter from './printer';

export { IConfig, IPrinter };

export interface IDataList {
    page?: number;
    count?: number;
}
