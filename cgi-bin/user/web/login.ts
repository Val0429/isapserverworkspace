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

type OutputC = IResponse.IUser.IWebLogin;

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
export async function Login(data: ActionParam<any>, input: IRequest.IUser.ILogin_User | IRequest.IUser.ILogin_SessionId): Promise<IResponse.IUser.IWebLogin> {
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

        let _company: IResponse.IObject = !_userInfo.company
            ? undefined
            : {
                  objectId: _userInfo.company.id,
                  name: _userInfo.company.getValue('name'),
              };

        let _floors: IResponse.IObject[] = !_userInfo.floors
            ? undefined
            : _userInfo.floors.map<IResponse.IObject>((value, index, array) => {
                  return {
                      objectId: value.id,
                      name: value.getValue('name'),
                  };
              });

        let _tree: IResponse.IUser.IWebLoginUserTree = undefined;
        if (!!_userInfo.treeIdDictionary) {
            _tree = {};

            Object.keys(_userInfo.treeIdDictionary).forEach((value, index, array) => {
                let l1 = _userInfo.treeIdDictionary[value];
                let building: IDB.LocationBuildings = l1.building;
                let buildingName: string = building.getValue('name');

                if (!_tree[buildingName]) {
                    _tree[buildingName] = {
                        building: {
                            objectId: building.id,
                            name: buildingName,
                        },
                        floors: [],
                    };
                }

                _tree[buildingName].floors = l1.floors.map((value1, index1, array1) => {
                    return {
                        objectId: value1.id,
                        name: value1.getValue('name'),
                    };
                });
            });
        }

        return {
            sessionId: sessionId,
            user: {
                objectId: user.id,
                roles: _userInfo.roles,
                username: user.getUsername(),
                name: _userInfo.info.getValue('name') || '',
                email: _userInfo.info.getValue('email') || '',
                phone: _userInfo.info.getValue('phone') || '',
                position: _userInfo.info.getValue('position') || '',
                remark: _userInfo.info.getValue('remark') || '',
                webLestUseDate: _userInfo.info.getValue('webLestUseDate'),
                company: _company,
                floors: _floors,
                tree: _tree,
            },
        };
    } catch (e) {
        throw e;
    }
}
