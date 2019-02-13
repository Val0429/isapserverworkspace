import { IUser, Action, Restful, RoleList, Errors, Parse } from 'core/cgi-package';
import { Config } from 'core/config.gen';
import { Tsc_Ttp247, File, Print } from 'workspace/custom/helpers';
import { IRequest } from '../../custom/models';

let action = new Action({
    loginRequired: false,
    permission: [],
});

export default action;

/**
 * Action Read
 */
type InputR = IRequest.IPrinter.ITsc_ttp247R;

type OutputR = string;

action.get(
    { inputType: 'InputR' },
    async (data): Promise<OutputR> => {
        let _input: InputR = data.inputType;

        let tsc: Tsc_Ttp247 = new Tsc_Ttp247();
        tsc.ip = Config.printer.ip;
        tsc.dllPath = File.RealPath(Config.printer.dllPath);
        tsc.Initialization();
        await tsc.PrintFetSticker(_input.visitor, _input.respondent, _input.location, _input.date);

        return '';
    },
);
