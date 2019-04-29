import { IConfig } from 'core/cgi-package';

export interface IIndexR {
    [key: string]: IConfig[keyof IConfig];
}
