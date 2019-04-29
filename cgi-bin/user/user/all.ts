import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, Regex } from '../../../custom/helpers';
import * as Enum from '../../../custom/enums';

let action = new Action({
    loginRequired: true,
});

export default action;

/**
 * Action Read
 */
type InputR = null;

type OutputR = IResponse.IUser.IUserAll[];

action.get(
    {
        permission: [RoleList.Admin, RoleList.User],
    },
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;

            let roleSystemAdministrator: Parse.Role = await new Parse.Query(Parse.Role)
                .equalTo('name', RoleList.SystemAdministrator)
                .first()
                .fail((e) => {
                    throw e;
                });

            let queryUser: Parse.Query<Parse.User> = new Parse.Query(Parse.User).notContainedIn('roles', [roleSystemAdministrator]);

            let totalUser: number = await queryUser.count().fail((e) => {
                throw e;
            });

            let users: Parse.User[] = await queryUser
                .limit(totalUser)
                .find()
                .fail((e) => {
                    throw e;
                });

            let queryUserInfo: Parse.Query<IDB.UserInfo> = new Parse.Query(IDB.UserInfo).containedIn('user', users).equalTo('isDeleted', false);

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
