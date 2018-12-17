import { registerSubclass, ParseObject } from './../../../helpers/parse-server/parse-helper';
import { IEventList, IRegion } from './';
import { IUser } from 'core/cgi-package';
import { State } from '../enums/state';

export interface IIncidentPackage {
    event: IEventList;
    region: IRegion;
    assignee: IUser;
    date: Date;
    state: State;
    videoPath: string;
    snapshot: Parse.File;
    report: string;
}

@registerSubclass()
export class IncidentPackage extends ParseObject<IIncidentPackage> {}
