import { serverReady } from 'core/pending-tasks';
import { createIndex } from 'helpers/parse-server/parse-helper';
import { Purposes } from './../../models/purposes';

(async () => {
    await serverReady;

    /// indexes ////////////////
    /// Kiosk
    createIndex("Purposes", "purposeUniqueName",
        { "name": 1 },
        { unique: true }
    );
    ////////////////////////////

    /// Create default purposes
    const defaultPurposes: string[] = ["Visit", "Meeting", "Delivery", "Others"];
    let purpose = await new Parse.Query(Purposes)
        .first();
    if (!purpose) {
        for(let p of defaultPurposes) {
            purpose = new Purposes({ name: p });
            await purpose.save();
        }
        console.log("<Default> Default Purposes created.");
    }

})();