import { RoleList } from 'core/userRoles.gen';
import { Print } from './';

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
}
