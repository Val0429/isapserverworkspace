import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse } from '../../custom/models';
import {} from '../../custom/helpers';
import * as Enum from '../../custom/enums';

let action = new Action({
    loginRequired: true,
    permission: [RoleList.SystemAdministrator, RoleList.Administrator, RoleList.Chairman, RoleList.DeputyChairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral, RoleList.Guard],
});

export default action;

/**
 * Action Create
 */
type InputC = string;

type OutputC = string;

action.post(
    { inputType: 'InputC' },
    async (data): Promise<OutputC> => {
        let _input: InputC = data.inputType;

        return '';
    },
);

/**
 * Action Read
 */
type InputR = string;

type OutputR = string;

action.get(
    { inputType: 'InputR' },
    async (data): Promise<OutputR> => {
        let _input: InputR = data.inputType;

        return '';
    },
);

/**
 * Action update
 */
type InputU = string;

type OutputU = string;

action.put(
    { inputType: 'InputU' },
    async (data): Promise<OutputU> => {
        let _input: InputU = data.inputType;

        return '';
    },
);

/**
 * Action Delete
 */
type InputD = string;

type OutputD = string;

action.delete(
    { inputType: 'InputD' },
    async (data): Promise<OutputD> => {
        let _input: InputD = data.inputType;

        return '';
    },
);
