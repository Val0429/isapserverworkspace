import { registerSubclass, ParseObject } from '../../../helpers/parse-server/parse-helper';

export interface IHuman {}

@registerSubclass()
export class human extends ParseObject<IHuman> {}
