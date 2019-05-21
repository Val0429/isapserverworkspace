import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print } from '../../../custom/helpers';
import * as Enum from '../../../custom/enums';

let action = new Action({
    loginRequired: true,
    permission: [RoleList.SystemAdministrator],
});

export default action;

/**
 * Action update
 */
type InputU = IRequest.IUser.IBaseRoleU;

type OutputU = Date;

action.put(
    {
        inputType: 'InputU',
    },
    async (data): Promise<OutputU> => {
        try {
            let _input: InputU = data.inputType;
            let _userId: string = _input.objectId || data.user.id;

            let user: Parse.User = await new Parse.Query(Parse.User).get(_userId).fail((e) => {
                throw e;
            });
            if (!user) {
                throw Errors.throw(Errors.CustomBadRequest, ['user not found']);
            }

            let roles: Parse.Role[] = await new Parse.Query(Parse.Role)
                .containedIn('name', _input.roles)
                .find()
                .fail((e) => {
                    throw e;
                });

            user.set('roles', roles);

            await user.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });

            return new Date();
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
