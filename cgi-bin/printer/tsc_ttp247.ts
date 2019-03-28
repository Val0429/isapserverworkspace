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
        let _input: InputC = data.inputType;
        let _date: string = _input.date || '';
        let _location: string = _input.locationName || '';

        let tsc: Tsc_Ttp247 = new Tsc_Ttp247();
        tsc.device = Config.printer.device;

        tsc.Initialization();

        let result: string = await tsc.PrintFetSticker(_input.visitorName, _input.respondentName, _location, _date);
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
        let _date: string = _input.date || '';
        let _location: string = _input.locationName || '';

        let tsc: Tsc_Ttp247 = new Tsc_Ttp247();
        tsc.device = Config.printer.device;

        tsc.Initialization();

        let result: string = await tsc.PrintFetSticker(_input.visitorName, _input.respondentName, _location, _date);
        Print.MinLog(`${DateTime.DateTime2String(new Date())}: ${JSON.stringify(_input)}`);

        return JSON.stringify(_input);
    },
);
