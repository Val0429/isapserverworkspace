import { serverReady } from 'core/pending-tasks';
import { createIndex } from 'helpers/parse-server/parse-helper';

(async () => {
    await serverReady;

    /// indexes ////////////////
    /// Visitors
    createIndex("Visitors", "uniquePhonePlusEmail",
        { "company": 1, "phone": 1, "email": 1 },
        { unique: true }
    );
    ////////////////////////////
})();