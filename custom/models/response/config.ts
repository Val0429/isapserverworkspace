import { IConfig } from 'core/cgi-package';

/**
 * Config
 */
export interface IIndexR {
    [key: string]: IConfig[keyof IConfig];
}
