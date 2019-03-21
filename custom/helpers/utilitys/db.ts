import { RoleList } from 'core/userRoles.gen';
import { ActionParam } from 'helpers/cgi-helpers/core';
import { IDB } from '../../models';
import { Print } from './';

interface IUserInfo {
    roles: string[];
    committee: IDB.CharacterCommittee;
    resident: IDB.CharacterResident;
    residentInfo: IDB.CharacterResidentInfo;
    community: IDB.Community;
}

export namespace Db {
    /**
     * Create default role
     */
    export async function CreateDefaultRole(): Promise<void> {
        try {
            let role = await new Parse.Query(Parse.Role).first().catch((e) => {
                throw e;
            });
            if (!role) {
                for (let key in RoleList) {
                    let name = RoleList[key];

                    let roleACL = new Parse.ACL();
                    roleACL.setPublicReadAccess(true);

                    role = new Parse.Role(name, roleACL);

                    await role.save(null, { useMasterKey: true }).catch((e) => {
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
            let user = await new Parse.Query(Parse.User).first().catch((e) => {
                throw e;
            });
            if (!user) {
                let roles: Parse.Role[] = await new Parse.Query(Parse.Role).find().catch((e) => {
                    throw e;
                });

                user = new Parse.User();

                user.setUsername('SysAdmin');
                user.setPassword('SysAdmin123456');
                user.set(
                    'roles',
                    roles.filter((value, index, array) => {
                        return value.getName() === RoleList.SystemAdministrator;
                    }),
                );

                await user.save(null, { useMasterKey: true }).catch((e) => {
                    throw e;
                });

                user = new Parse.User();

                user.setUsername('Admin');
                user.setPassword('Admin123456');
                user.set(
                    'roles',
                    roles.filter((value, index, array) => {
                        return value.getName() === RoleList.Administrator;
                    }),
                );

                await user.save(null, { useMasterKey: true }).catch((e) => {
                    throw e;
                });

                Print.Message({ message: '  ', background: Print.BackColor.blue }, { message: 'Create Default:', color: Print.FontColor.blue }, { message: '- Users:  ' }, { message: '<SysAdmin>, <Admin>', color: Print.FontColor.cyan });
            }
        } catch (e) {
            throw e;
        }
    }

    /**
     *
     * @param data
     */
    export async function GetUserInfo(data: ActionParam<any>): Promise<IUserInfo> {
        try {
            let roles: string[] = data.role.map((value, index, array) => {
                return value.getName();
            });

            let userInfo: IUserInfo = {
                roles: roles,
                committee: undefined,
                resident: undefined,
                residentInfo: undefined,
                community: undefined,
            };

            if (roles.indexOf(RoleList.Resident) > -1) {
                let residentInfo: IDB.CharacterResidentInfo = await new Parse.Query(IDB.CharacterResidentInfo)
                    .equalTo('user', data.user)
                    .include(['community', 'resident'])
                    .first()
                    .catch((e) => {
                        throw e;
                    });

                userInfo.resident = residentInfo.getValue('resident');
                userInfo.residentInfo = residentInfo;
                userInfo.community = residentInfo.getValue('community');
            } else if (roles.indexOf(RoleList.Chairman) > -1 || roles.indexOf(RoleList.DeputyChairman) > -1 || roles.indexOf(RoleList.FinanceCommittee) > -1 || roles.indexOf(RoleList.DirectorGeneral) > -1 || roles.indexOf(RoleList.Guard) > -1) {
                let committee: IDB.CharacterCommittee = await new Parse.Query(IDB.CharacterCommittee)
                    .equalTo('user', data.user)
                    .include('community')
                    .first()
                    .catch((e) => {
                        throw e;
                    });

                userInfo.committee = committee;
                userInfo.community = committee.getValue('community');
            }

            return userInfo;
        } catch (e) {
            throw e;
        }
    }
}
