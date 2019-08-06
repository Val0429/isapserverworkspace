import { serverReady } from 'core/pending-tasks';
import { createIndex } from 'helpers/parse-server/parse-helper';
import { Flow1Purposes } from './../../models';
import { Config } from 'core/config.gen';

(async () => {
    await serverReady;

    let flow = Config.vms.flow;

    if (flow === "Flow1") {
        /// indexes ////////////////
        createIndex("Flow1Purposes", "purposeUniqueName",
            { "name": 1 },
            { unique: true }
        );
        ////////////////////////////

        /// Create default purposes
        const defaultPurposes: string[] = ["Visit", "Meeting", "Delivery", "Others"];
        let purpose = await new Parse.Query(Flow1Purposes)
            .first();
        if (!purpose) {
            for(let p of defaultPurposes) {
                purpose = new Flow1Purposes({ name: p });
                await purpose.save();
            }
            console.log("<Default> Default Purposes created.");
        }
    }

})();