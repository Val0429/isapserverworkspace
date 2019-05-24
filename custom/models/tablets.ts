import { registerSubclass, ParseObject } from './../../../helpers/parse-server/parse-helper';

export interface ITablets {
    ip: string;
    port: number;
    account: string;
    password: string;
}
@registerSubclass() export class Tablets extends ParseObject<ITablets> {}