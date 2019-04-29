import { serverReady } from 'core/pending-tasks';
import { Config } from 'core/config.gen';
import { createIndex } from 'helpers/parse-server/parse-helper';

(async () => {
    if (!Config.mongodb.enable) {
        return;
    }

    createIndex('UserInfo', 'userInfoIndex', { user: 1 });
})();
