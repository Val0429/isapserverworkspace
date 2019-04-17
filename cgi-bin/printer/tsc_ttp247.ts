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

            _input = FontFormat(_input);

            let tsc: Tsc_Ttp247 = new Tsc_Ttp247();

            tsc.Initialization();

            let result: string = await tsc.PrintFetSticker(_input.visitorName, _input.respondentName, _input.locationName, _input.date);
            Print.MinLog(`${DateTime.DateTime2String(new Date())}: ${JSON.stringify(_input)}`);

            return 'OK';
        } catch (e) {
            Print.Log(new Error(JSON.stringify(e)), 'error');
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
            _input.locationName = '';

            _input = FontFormat(_input);

            let tsc: Tsc_Ttp247 = new Tsc_Ttp247();

            tsc.Initialization();

            let result: string = await tsc.PrintFetSticker(_input.visitorName, _input.respondentName, _input.locationName, _input.date);
            Print.MinLog(`${DateTime.DateTime2String(new Date())}: ${JSON.stringify(_input)}`);

            return 'OK';
        } catch (e) {
            Print.Log(new Error(JSON.stringify(e)), 'error');
            throw e;
        }
    },
);

/**
 *
 */
interface ILimit {
    [key: string]: {
        fraction: number;
        regex: RegExp;
    };
}

/**
 *
 * @param limit
 * @param str
 */
function Str2Fractions(limit: ILimit, str: string): number[] {
    return str.split('').map((value, index, array) => {
        if (new RegExp(limit['ch'].regex).test(value)) return limit['ch'].fraction;
        else if (new RegExp(limit['EN'].regex).test(value)) return limit['EN'].fraction;
        else if (new RegExp(limit['en'].regex).test(value)) return limit['en'].fraction;
        else if (new RegExp(limit['num'].regex).test(value)) return limit['num'].fraction;

        return 0;
    });
}

/**
 *
 * @param nums
 */
function GetTotal(nums: number[]): number {
    return nums.reduce((prev, curr, index, array) => {
        return prev + curr;
    }, 0);
}

/**
 *
 * @param total
 * @param nums
 */
function GetPruneLength(total: number, nums: number[]): number {
    while (true) {
        if (total >= GetTotal(nums)) break;

        nums.length = nums.length - 1;
    }

    return nums.length;
}

/**
 *
 * @param input
 */
export function FontFormat(input: IRequest.IPrinter.ITsc_ttp247R): IRequest.IPrinter.ITsc_ttp247R {
    const total: number = 440;
    const limit: ILimit = {
        ch: {
            fraction: 88,
            regex: /[^0-9a-zA-Z]/g,
        },
        EN: {
            fraction: 55,
            regex: /[A-Z]/g,
        },
        en: {
            fraction: 40,
            regex: /[a-z]/g,
        },
        num: {
            fraction: 44,
            regex: /[0-9]/g,
        },
    };

    let fractions: number[] = Str2Fractions(limit, input.visitorName);
    input.visitorName = input.visitorName.substr(0, GetPruneLength(total, fractions));

    fractions = Str2Fractions(limit, input.respondentName);
    input.respondentName = input.respondentName.substr(0, GetPruneLength(total, fractions));

    fractions = Str2Fractions(limit, input.date);
    input.date = input.date.substr(0, GetPruneLength(total, fractions));

    fractions = Str2Fractions(limit, input.locationName);
    input.locationName = input.locationName.substr(0, GetPruneLength(total, fractions));

    return input;
}
