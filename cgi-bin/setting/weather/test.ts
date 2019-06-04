import { IUser, Action, Restful, RoleList, Errors, Socket, Config } from 'core/cgi-package';
import { ScheduleActionEmail, ScheduleActionEmailResult } from 'core/scheduler-loader';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, Weather, Db } from '../../../custom/helpers';
import * as Enum from '../../../custom/enums';

let action = new Action({
    loginRequired: true,
    permission: [RoleList.SuperAdministrator, RoleList.Admin],
});

export default action;

/**
 * Action Create
 */
type InputC = IRequest.ISetting.IWeatherTest;

type OutputC = IResponse.ISetting.IWeatherTest;

action.post(
    {
        inputType: 'InputC',
    },
    async (data): Promise<OutputC> => {
        try {
            let _input: InputC = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);

            let weather: Weather.Darksky = new Weather.Darksky();
            weather.secretKey = Config.darksky.secretKey;

            weather.Initialization();

            let result = await weather.GetCurrent(_input.latitude, _input.longitude);

            return result;
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
