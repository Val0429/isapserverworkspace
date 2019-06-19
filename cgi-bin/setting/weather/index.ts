import { IUser, Action, Restful, RoleList, Errors, Socket, Config } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, Weather, File, Db } from '../../../custom/helpers';
import * as Enum from '../../../custom/enums';
import { UpdateConfig } from '../../config';

let action = new Action({
    loginRequired: true,
    permission: [RoleList.SuperAdministrator, RoleList.Admin],
});

export default action;

/**
 * Action Read
 */
type InputR = null;

type OutputR = IResponse.ISetting.IWeatherR;

action.get(
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);

            let config = Config.darksky;

            return {
                secretKey: config.secretKey,
            };
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);

/**
 * Action update
 */
type InputU = IRequest.ISetting.IWeatherU;

type OutputU = Date;

action.put(
    {
        inputType: 'InputU',
    },
    async (data): Promise<OutputU> => {
        try {
            let _input: InputU = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);

            let weather: Weather.Darksky = new Weather.Darksky();
            weather.secretKey = _input.secretKey;

            weather.Initialization();

            let result = await weather.GetCurrent(0, 0);

            await UpdateConfig('darksky', _input);
            Config['darksky'] = { ...Config['darksky'], ..._input };

            Print.Log('Write weather config', new Error(), 'warning', { now: true });
            File.WriteFile('workspace/custom/assets/config/darksky.json', JSON.stringify(_input));

            return new Date();
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
