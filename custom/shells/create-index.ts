import { serverReady } from 'core/pending-tasks';
import { Config } from 'core/config.gen';
import { createIndex } from 'helpers/parse-server/parse-helper';
import * as Main from '../../main';

Main.ready$.subscribe({
    next: async () => {
        if (!Config.mongodb.enable) {
            return;
        }
    },
});
