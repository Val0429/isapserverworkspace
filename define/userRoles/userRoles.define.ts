import * as Enum from '../../custom/enums';

let userRoles: Config[] = [[0, 'SystemAdministrator'], [1, 'Administrator'], [10, 'Chairman'], [11, 'DeputyChairman'], [12, 'FinanceCommittee'], [13, 'DirectorGeneral'], [14, 'Guard'], [30, 'Resident']];

export default userRoles;

export type Config = [number, string];
