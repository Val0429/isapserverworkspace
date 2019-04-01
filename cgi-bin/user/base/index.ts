import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import {} from '../../../custom/helpers';
import * as Enum from '../../../custom/enums';

let action = new Action({
    loginRequired: true,
    permission: [RoleList.SystemAdministrator],
});

export default action;

/**
 * Action Read
 */
type InputR = IRequest.IDataList;

type OutputR = IResponse.IDataList<IResponse.IUser.IBaseIndexR[]>;

action.get(
    { inputType: 'InputR' },
    async (data): Promise<OutputR> => {
        let _input: InputR = data.inputType;
        let _page: number = _input.page || 1;
        let _count: number = _input.count || 10;

        let query: Parse.Query<Parse.User> = new Parse.Query(Parse.User);

        let total: number = await query.count().fail((e) => {
            throw e;
        });

        let users: Parse.User[] = await query
            .skip((_page - 1) * _count)
            .limit(_count)
            .include('roles')
            .find()
            .fail((e) => {
                throw e;
            });

        return {
            total: total,
            page: _page,
            count: _count,
            content: users.map((value, index, array) => {
                return {
                    userId: value.id,
                    account: value.getUsername(),
                    roles: value.get('roles').map((value, index, array) => {
                        return Object.keys(RoleList).find((value1, index1, array1) => {
                            return value.get('name') === RoleList[value1];
                        });
                    }),
                };
            }),
        };
    },
);

/**
 * Action update
 */
type InputU = IRequest.IUser.IBaseIndexU;

type OutputU = Date;

action.put(
    { inputType: 'InputU' },
    async (data): Promise<OutputU> => {
        let _input: InputU = data.inputType;

        let user: Parse.User = await new Parse.Query(Parse.User)
            .include('roles')
            .get(_input.userId)
            .fail((e) => {
                throw e;
            });
        if (!user) {
            throw Errors.throw(Errors.CustomBadRequest, ['user not found']);
        }

        if (_input.roles) {
            let roles: Parse.Role[] = await new Parse.Query(Parse.Role)
                .containedIn('name', _input.roles)
                .find()
                .fail((e) => {
                    throw e;
                });

            user.set('roles', roles);
        }
        if (_input.password) {
            user.setPassword(_input.password);
        }

        await user.save(null, { useMasterKey: true }).fail((e) => {
            throw e;
        });

        return new Date();
    },
);
