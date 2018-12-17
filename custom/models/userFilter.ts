import { registerSubclass, ParseObject } from './../../../helpers/parse-server/parse-helper';
import { IUserSchedule } from './';
import { IUser } from 'core/cgi-package';

export interface IUserFilter {
    schedules?: IUserSchedule[];
    exceptions?: IUserSchedule[];
    defaultUser: IUser;
}

@registerSubclass()
export class UserFilter extends ParseObject<IUserFilter> {}
