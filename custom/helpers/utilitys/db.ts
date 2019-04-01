import { RoleList } from 'core/userRoles.gen';
import { Print } from './';
import { IDB } from '../../models';

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

                user = new Parse.User();

                user.setUsername('SysAdmin');
                user.setPassword('SysAdmin12356');
                user.set('roles', roles);

                await user.save(null, { useMasterKey: true }).fail((e) => {
                    throw e;
                });

                let info: IDB.UserInfo = new IDB.UserInfo();

                info.setValue('user', user);
                info.setValue('name', 'SysAdmin');
                info.setValue('isDeleted', false);

                await info.save(null, { useMasterKey: true }).fail((e) => {
                    throw e;
                });

                Print.Message({ message: '  ', background: Print.BackColor.blue }, { message: 'Create Default:', color: Print.FontColor.blue }, { message: '- Users:  ' }, { message: '<SysAdmin>', color: Print.FontColor.cyan });
            }
        } catch (e) {
            throw e;
        }
    }
}
