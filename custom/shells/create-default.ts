import { serverReady } from 'core/pending-tasks';
import { Config } from 'core/config.gen';
import { RoleList } from 'core/userRoles.gen';
import { Db, Print } from '../helpers';
import * as Main from '../../main';

Main.ready$.subscribe({
    next: async () => {
        if (!Config.mongodb.enable) {
            return;
        }

        await Db.CreateDefaultRole();
        await Db.CreateDefaultUser();
    },
});
