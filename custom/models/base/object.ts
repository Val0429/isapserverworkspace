import { IObject } from '../response/_index';

export interface IKeyValue<T> {
    [key: string]: T;
}

export interface IKeyValueObject<T = {}> {
    [key: string]: IObject & T;
}
