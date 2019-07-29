import { IUser, Action, Restful, RoleList, Errors, Socket } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, Weather, File, Db } from '../../../custom/helpers';
import * as Enum from '../../../custom/enums';
import { default as DataCenter } from '../../../custom/services/data-center';

let action = new Action({
    loginRequired: true,
});

export default action;

/**
 * Action Read
 */
type InputR = null;

type OutputR = IResponse.ISetting.IWeatherR;

action.get(
    {
        permission: [RoleList.SuperAdministrator, RoleList.Admin],
    },
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);

            let setting = DataCenter.weatherSetting$.value;

            return {
                secretKey: setting.darksky.secretKey,
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
        permission: [RoleList.SuperAdministrator, RoleList.Admin],
    },
    async (data): Promise<OutputU> => {
        try {
            let _input: InputU = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);

            let weather: Weather.Darksky = new Weather.Darksky();
            weather.secretKey = _input.secretKey;

            weather.Initialization();

            let result = await weather.GetCurrent(0, 0);

            DataCenter.weatherSetting$.next({
                enable: true,
                darksky: {
                    secretKey: _input.secretKey,
                },
            });

            return new Date();
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
