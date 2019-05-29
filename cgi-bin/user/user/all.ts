import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, Db } from '../../../custom/helpers';
import * as Enum from '../../../custom/enums';

let action = new Action({
    loginRequired: true,
    permission: [RoleList.SuperAdministrator, RoleList.Admin, RoleList.User],
});

export default action;

/**
 * Action Read
 */
type InputR = null;

type OutputR = IResponse.IUser.IUserAll[];

action.get(
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);

            let roleLists: RoleList[] = [RoleList.SystemAdministrator];
            if (_userInfo.roles.indexOf(RoleList.SuperAdministrator) < 0) {
                roleLists.push(RoleList.SuperAdministrator);
            }
            let roleExcludes: Parse.Role[] = await new Parse.Query(Parse.Role)
                .containedIn('name', roleLists)
                .find()
                .fail((e) => {
                    throw e;
                });

            let queryUser: Parse.Query<Parse.User> = new Parse.Query(Parse.User).notContainedIn('roles', roleExcludes);

            let totalUser: number = await queryUser.count().fail((e) => {
                throw e;
            });

            let users: Parse.User[] = await queryUser
                .limit(totalUser)
                .find()
                .fail((e) => {
                    throw e;
                });

            let queryUserInfo: Parse.Query<IDB.UserInfo> = new Parse.Query(IDB.UserInfo).containedIn('user', users);

            let totalUserInfo: number = await queryUserInfo.count().fail((e) => {
                throw e;
            });

            let infos: IDB.UserInfo[] = await queryUserInfo
                .limit(totalUserInfo)
                .find()
                .fail((e) => {
                    throw e;
                });

            return infos.map((value, index, array) => {
                return {
                    objectId: value.getValue('user').id,
                    name: value.getValue('name'),
                };
            });
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
