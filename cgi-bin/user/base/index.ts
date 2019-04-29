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
 * Action Read
 */
type InputR = IRequest.IDataList;

type OutputR = IResponse.IDataList<IResponse.IUser.IBaseIndexR>;

action.get(
    { inputType: 'InputR' },
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;
            let _paging: IRequest.IPaging = _input.paging || { page: 1, pageSize: 10 };
            let _page: number = _paging.page || 1;
            let _pageSize: number = _paging.pageSize || 10;

            let query: Parse.Query<Parse.User> = new Parse.Query(Parse.User);

            let total: number = await query.count().fail((e) => {
                throw e;
            });
            let totalPage: number = Math.ceil(total / _pageSize);

            let users: Parse.User[] = await query
                .skip((_page - 1) * _pageSize)
                .limit(_pageSize)
                .include('roles')
                .find()
                .fail((e) => {
                    throw e;
                });

            return {
                paging: {
                    total: total,
                    totalPages: totalPage,
                    page: _page,
                    pageSize: _pageSize,
                },
                results: users.map((value, index, array) => {
                    return {
                        objectId: value.id,
                        account: value.getUsername(),
                        roles: value.get('roles').map((value, index, array) => {
                            return Object.keys(RoleList).find((value1, index1, array1) => {
                                return value.get('name') === RoleList[value1];
                            });
                        }),
                    };
                }),
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
type InputU = IRequest.IUser.IBaseIndexU;

type OutputU = Date;

action.put(
    { inputType: 'InputU' },
    async (data): Promise<OutputU> => {
        try {
            let _input: InputU = data.inputType;

            let user: Parse.User = await new Parse.Query(Parse.User)
                .include('roles')
                .get(_input.objectId)
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
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
