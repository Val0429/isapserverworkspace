import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { Config } from 'core/config.gen';
import { Tsc_Ttp247, Print, DateTime } from 'workspace/custom/helpers';
import { IRequest } from '../../custom/models';
import { FontFormat } from './tsc_ttp247';

let action = new Action({
    loginRequired: false,
    permission: [],
});

export default action;

/**
 * Action
 */
type InputC = IRequest.IPrinter.ITsc_ttp247R;

type OutputC = string;

action.post(
    { inputType: 'InputC' },
    async (data): Promise<OutputC> => {
        let _input: InputC = data.inputType;

        _input.date = _input.date || '';
        _input.locationName = _input.locationName || '';

        _input = FontFormat(_input);

        Print.MinLog(`${DateTime.DateTime2String(new Date())}: ${JSON.stringify(_input)}`);

        return JSON.stringify(_input);
    },
);

/**
 * Action
 */
type InputR = IRequest.IPrinter.ITsc_ttp247R;

type OutputR = string;

action.get(
    { inputType: 'InputR' },
    async (data): Promise<OutputR> => {
        let _input: InputR = data.inputType;

        _input.date = _input.date || '';
        _input.locationName = _input.locationName || '';

        _input = FontFormat(_input);

        Print.MinLog(`${DateTime.DateTime2String(new Date())}: ${JSON.stringify(_input)}`);

        return JSON.stringify(_input);
    },
);
