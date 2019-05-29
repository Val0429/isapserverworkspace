import { Action, Errors, EventLogin, Events, UserHelper, ParseObject, RoleList } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, Db } from '../../../custom/helpers';
import * as Enum from '../../../custom/enums';
import { Request } from 'express';

let action = new Action({
    loginRequired: false,
    permission: [],
});

export default action;

/**
 * Action Login
 */
type InputC = IRequest.IUser.IBaseLogin;

type OutputC = IResponse.IUser.IUserLogin;

action.post(
    {
        inputType: 'InputC',
    },
    async (data): Promise<OutputC> => {
        try {
            let _input: InputC = data.inputType;

            return await Login(data.request, _input.account, _input.password);
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);

/**
 * Login
 * @param request
 * @param account
 * @param password
 */
export async function Login(request: Request, account: string, password: string): Promise<IResponse.IUser.IUserLogin> {
    try {
        let user = await UserHelper.login({
            username: account,
            password: password,
        }).catch((e) => {
            throw e;
        });

        let _userInfo = await Db.GetUserInfo(request, user.user);

        let event: EventLogin = new EventLogin({
            owner: user.user,
        });
        await Events.save(event).catch((e) => {
            throw e;
        });

        let roles = _userInfo.roles.map((value, index, array) => {
            return Object.keys(RoleList).find((value1, index1, array1) => {
                return value === RoleList[value1];
            });
        });

        let sites = (_userInfo.info.getValue('sites') || []).map((value1, index1, array1) => {
            return {
                objectId: value1.id,
                name: value1.getValue('name'),
            };
        });

        let groups = (_userInfo.info.getValue('groups') || []).map((value1, index1, array1) => {
            return {
                objectId: value1.id,
                name: value1.getValue('name'),
            };
        });

        return {
            sessionId: user.sessionId,
            objectId: user.user.id,
            roles: roles,
            account: user.user.getUsername(),
            name: _userInfo.info.getValue('name') || '',
            employeeId: _userInfo.info.getValue('customId') || '',
            email: _userInfo.info.getValue('email') || '',
            phone: _userInfo.info.getValue('phone') || '',
            webLestUseDate: _userInfo.info.getValue('webLestUseDate'),
            appLastUseDate: _userInfo.info.getValue('appLastUseDate'),
            locations: sites,
            groups: groups,
            isAppBinding: !!_userInfo.info.getValue('mobileType') && _userInfo.info.getValue('mobileType') !== Enum.EMobileType.none,
        };
    } catch (e) {
        throw e;
    }
}
