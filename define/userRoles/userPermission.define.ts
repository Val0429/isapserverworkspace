import { RoleList } from 'core/cgi-package';

/**
 *
 */
export interface IPermissionMap {
    [RoleList.SystemAdministrator]: RoleList[];
    [RoleList.Chairman]: RoleList[];
    [RoleList.DeputyChairman]: RoleList[];
    [RoleList.FinanceCommittee]: RoleList[];
    [RoleList.DirectorGeneral]: RoleList[];
    [RoleList.Guard]: RoleList[];
    [RoleList.Resident]: RoleList[];
}

/**
 *
 */
export const permissionMapC: IPermissionMap = {
    [RoleList.SystemAdministrator]: [RoleList.SystemAdministrator, RoleList.Chairman, RoleList.DeputyChairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral, RoleList.Guard, RoleList.Resident],
    [RoleList.Chairman]: [RoleList.Chairman, RoleList.DeputyChairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral, RoleList.Guard, RoleList.Resident],
    [RoleList.DeputyChairman]: [RoleList.DeputyChairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral, RoleList.Guard],
    [RoleList.FinanceCommittee]: [],
    [RoleList.DirectorGeneral]: [RoleList.Resident],
    [RoleList.Guard]: [RoleList.Resident],
    [RoleList.Resident]: [],
};

/**
 *
 */
export const permissionMapR: IPermissionMap = {
    [RoleList.SystemAdministrator]: [RoleList.SystemAdministrator, RoleList.Chairman, RoleList.DeputyChairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral, RoleList.Guard, RoleList.Resident],
    [RoleList.Chairman]: [RoleList.Chairman, RoleList.DeputyChairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral, RoleList.Guard],
    [RoleList.DeputyChairman]: [RoleList.Chairman, RoleList.DeputyChairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral, RoleList.Guard],
    [RoleList.FinanceCommittee]: [RoleList.Chairman, RoleList.DeputyChairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral, RoleList.Guard],
    [RoleList.DirectorGeneral]: [RoleList.Chairman, RoleList.DeputyChairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral, RoleList.Guard],
    [RoleList.Guard]: [RoleList.Chairman, RoleList.DeputyChairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral, RoleList.Guard],
    [RoleList.Resident]: [],
};

/**
 *
 */
export const permissionMapU: IPermissionMap = {
    [RoleList.SystemAdministrator]: [RoleList.SystemAdministrator, RoleList.Chairman, RoleList.DeputyChairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral, RoleList.Guard, RoleList.Resident],
    [RoleList.Chairman]: [RoleList.Chairman, RoleList.DeputyChairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral, RoleList.Guard],
    [RoleList.DeputyChairman]: [RoleList.DeputyChairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral, RoleList.Guard],
    [RoleList.FinanceCommittee]: [],
    [RoleList.DirectorGeneral]: [],
    [RoleList.Guard]: [],
    [RoleList.Resident]: [],
};

/**
 *
 */
export const permissionMapD: IPermissionMap = {
    [RoleList.SystemAdministrator]: [RoleList.SystemAdministrator, RoleList.Chairman, RoleList.DeputyChairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral, RoleList.Guard, RoleList.Resident],
    [RoleList.Chairman]: [RoleList.Chairman, RoleList.DeputyChairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral, RoleList.Guard, RoleList.Resident],
    [RoleList.DeputyChairman]: [RoleList.DeputyChairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral, RoleList.Guard],
    [RoleList.FinanceCommittee]: [],
    [RoleList.DirectorGeneral]: [RoleList.Resident],
    [RoleList.Guard]: [],
    [RoleList.Resident]: [],
};
