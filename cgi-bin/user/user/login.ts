import { Action, Errors, EventLogin, Events, UserHelper, ParseObject, RoleList, ActionParam } from 'core/cgi-package';
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
type InputC = IRequest.IUser.ILogin_User | IRequest.IUser.ILogin_SessionId;

type OutputC = IResponse.IUser.IUserLogin;

action.post(
    {
        inputType: 'InputC',
    },
    async (data): Promise<OutputC> => {
        try {
            let _input: InputC = data.inputType;

            return await Login(data, _input);
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);

/**
 * Login
 * @param request
 * @param user
 */
export async function Login(data: ActionParam<any>, input: IRequest.IUser.ILogin_User | IRequest.IUser.ILogin_SessionId): Promise<IResponse.IUser.IUserLogin> {
    try {
        let user: Parse.User = undefined;
        let sessionId: string = '';

        if ('username' in input) {
            let login = await UserHelper.login({
                username: input.username,
                password: input.password,
            }).catch((e) => {
                throw e;
            });

            user = login.user;
            sessionId = login.sessionId;
        } else {
            if (!input.sessionId) {
                throw Errors.throw(Errors.CustomUnauthorized, ['This session is not valid or is already expired.']);
            }
            if (!data.user) {
                throw Errors.throw(Errors.LoginFailed);
            }

            user = data.user;
            sessionId = input.sessionId;
        }

        let _userInfo = await Db.GetUserInfo(data.request, user);

        let event: EventLogin = new EventLogin({
            owner: user,
        });
        await Events.save(event).catch((e) => {
            throw e;
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

        let allowSites = (_userInfo.sites || []).map((value1, index1, array1) => {
            return {
                objectId: value1.id,
                name: value1.getValue('name'),
            };
        });

        return {
            sessionId: sessionId,
            user: {
                objectId: user.id,
                roles: _userInfo.roles,
                username: user.getUsername(),
                name: _userInfo.info.getValue('name') || '',
                employeeId: _userInfo.info.getValue('customId') || '',
                email: _userInfo.info.getValue('email') || '',
                phone: _userInfo.info.getValue('phone') || '',
                webLestUseDate: _userInfo.info.getValue('webLestUseDate'),
                appLastUseDate: _userInfo.info.getValue('appLastUseDate'),
                sites: sites,
                groups: groups,
                isAppBinding: !!_userInfo.info.getValue('mobileType') && _userInfo.info.getValue('mobileType') !== Enum.EMobileType.none,
                allowSites: allowSites,
            },
        };
    } catch (e) {
        throw e;
    }
}
