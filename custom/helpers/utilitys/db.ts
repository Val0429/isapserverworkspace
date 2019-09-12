import { Errors } from 'core/errors.gen';
import { RoleList } from 'core/userRoles.gen';
import { Request } from 'express';
import { Print } from './';
import { IDB, IResponse } from '../../models';

export namespace Db {
    /**
     * Create default role
     */
    export async function CreateDefaultRole(): Promise<void> {
        try {
            let role = await new Parse.Query(Parse.Role).first().fail((e) => {
                throw e;
            });
            if (!role) {
                for (let key in RoleList) {
                    let name = RoleList[key];

                    let roleACL = new Parse.ACL();
                    roleACL.setPublicReadAccess(true);

                    role = new Parse.Role(name, roleACL);

                    await role.save(null, { useMasterKey: true }).fail((e) => {
                        throw e;
                    });
                }

                let roles: string[] = Object.keys(RoleList).map((value, index, array) => {
                    return `<${value}>`;
                });
                Print.Message({ message: '  ', background: Print.BackColor.blue }, { message: 'Create Default:', color: Print.FontColor.blue }, { message: '- Roles:  ' }, { message: roles.join(', '), color: Print.FontColor.cyan });
            }
        } catch (e) {
            throw e;
        }
    }

    /**
     * Create default user
     */
    export async function CreateDefaultUser(): Promise<void> {
        try {
            let user = await new Parse.Query(Parse.User).first().fail((e) => {
                throw e;
            });
            if (!user) {
                let roles: Parse.Role[] = await new Parse.Query(Parse.Role).find().fail((e) => {
                    throw e;
                });

                await CreateUser('Admin', '123456', roles);

                Print.Message({ message: '  ', background: Print.BackColor.blue }, { message: 'Create Default:', color: Print.FontColor.blue }, { message: '- Users:  ' }, { message: '<Admin>', color: Print.FontColor.cyan });
            }
        } catch (e) {
            throw e;
        }
    }

    /**
     * Create user
     * @param username
     * @param password
     * @param roles
     */
    async function CreateUser(username: string, password: string, roles: Parse.Role[]): Promise<void> {
        try {
            let user = new Parse.User();

            user.setUsername(username);
            user.setPassword(password);
            user.set('roles', roles);

            await user.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });

            let info: IDB.UserInfo = new IDB.UserInfo();

            info.setValue('user', user);
            info.setValue('roles', roles);
            info.setValue('account', username);
            info.setValue('name', username);

            await info.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });
        } catch (e) {
            throw e;
        }
    }

    interface IUserInfo {
        roleLists: RoleList[];
        roles: IResponse.IObject[];
        info: IDB.UserInfo;
        company: IDB.LocationCompanies;
        floors: IDB.LocationFloors[];
    }

    /**
     * Get user info
     * @param data
     * @param from
     */
    export async function GetUserInfo(req: Request, user: Parse.User): Promise<IUserInfo> {
        try {
            let info: IDB.UserInfo = await new Parse.Query(IDB.UserInfo)
                .equalTo('user', user)
                .include(['company', 'floors'])
                .first()
                .fail((e) => {
                    throw e;
                });
            if (!info) {
                throw Errors.throw(Errors.CustomBadRequest, ['user info not found']);
            }

            let roleLists: RoleList[] = [];
            let roles = (user.get('roles') as Parse.Role[]).map<IResponse.IObject>((value, index, array) => {
                roleLists.push(value.getName() as RoleList);

                return {
                    objectId: value.id,
                    name: Object.keys(RoleList).find((value1, index1, array1) => {
                        return value.getName() === RoleList[value1];
                    }),
                };
            });

            let from = req.headers['client-from'];
            if (from === 'app') {
                info.setValue('appLastUseDate', new Date());
            } else if (from === 'web') {
                info.setValue('webLestUseDate', new Date());
            }

            await info.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });

            let company: IDB.LocationCompanies = roleLists.indexOf(RoleList.SystemAdministrator) > -1 || roleLists.indexOf(RoleList.Administrator) > -1 ? undefined : info.getValue('company');

            let floors: IDB.LocationFloors[] = roleLists.indexOf(RoleList.SystemAdministrator) > -1 || roleLists.indexOf(RoleList.Administrator) > -1 ? undefined : info.getValue('floors');

            return {
                roleLists: roleLists,
                roles: roles,
                info: info,
                company: company,
                floors: floors,
            };
        } catch (e) {
            throw e;
        }
    }
}
