import { registerSubclass, ParseObject } from './../../../helpers/parse-server/parse-helper';
import { ISchedule } from './';
import { IUser } from 'core/cgi-package';

export interface IUserSchedule {
    schedule: ISchedule;
    user?: IUser;
}

@registerSubclass()
export class UserSchedule extends ParseObject<IUserSchedule> {}
