import { serverReady } from 'core/pending-tasks';
import { createIndex } from 'helpers/parse-server/parse-helper';

(async () => {
    await serverReady;

    /// indexes ////////////////
    /// Visitor Name
    createIndex("Events", "visitorNameTextIndex",
        { "data.visitorName": "text" }
    );

    createIndex("Events", "MainIndex",
        { "_created_at": 1, "data.visitor.objectId": 1 },
        { unique: true }
    );
    ////////////////////////////
})();

