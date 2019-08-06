import { serverReady } from 'core/pending-tasks';
import { createIndex, sharedMongoDB } from 'helpers/parse-server/parse-helper';
import { Config } from 'core/config.gen';
import { Log } from 'helpers/utility';

(async () => {
    await serverReady;

    let flow = Config.vms.flow;

    if (flow === "Flow1") {
        /// indexes ////////////////
        /// Visitors
        createIndex("Flow1Visitors", "uniquePhonePlusEmail",
            { "company": 1, "phone": 1, "email": 1 },
            { unique: true }
        );
        ////////////////////////////
    }
})();