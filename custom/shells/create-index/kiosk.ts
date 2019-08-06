import { serverReady } from 'core/pending-tasks';
import { createIndex } from 'helpers/parse-server/parse-helper';

(async () => {
    await serverReady;

    /// indexes ////////////////
    /// Kiosk
    createIndex("_User", "kioskUniqueID",
        { "data.kioskId": 1 },
        { unique: true, partialFilterExpression: { "data.kioskId": { $exists: true } } }
    );
    ////////////////////////////

})();