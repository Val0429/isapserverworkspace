import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { Config } from 'core/config.gen';
import { Tsc_Ttp247, Print, DateTime } from 'workspace/custom/helpers';
import { IRequest } from '../../custom/models';

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
        try {
            let _input: InputC = data.inputType;

            _input.date = _input.date || '';
            _input.locationName = '';

            let tsc: Tsc_Ttp247 = new Tsc_Ttp247();

            tsc.Initialization();

            let result: string = await tsc.PrintFetSticker(_input.visitorName, _input.respondentName, _input.locationName, _input.date);
            Print.MinLog(`${DateTime.ToString(new Date())}: ${JSON.stringify(_input)}`);

            return 'OK';
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
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
        try {
            let _input: InputR = data.inputType;

            _input.date = _input.date || '';
            _input.locationName = _input.locationName || '';

            let tsc: Tsc_Ttp247 = new Tsc_Ttp247();

            tsc.Initialization();

            let result: string = await tsc.PrintFetSticker(_input.visitorName, _input.respondentName, _input.locationName, _input.date);
            Print.MinLog(`${DateTime.ToString(new Date())}: ${JSON.stringify(_input)}`);

            return 'OK';
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
