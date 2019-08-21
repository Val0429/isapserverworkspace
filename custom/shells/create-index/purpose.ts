import { serverReady } from 'core/pending-tasks';
import { createIndex, ensureCollectionExists } from 'helpers/parse-server/parse-helper';
import { Flow1Purposes, Flow2Purposes } from './../../models';
import { Config } from 'core/config.gen';



(async () => {
    await serverReady;

    let flow = Config.vms.flow;

    if (flow === "Flow1") {
        /// indexes ////////////////
        await ensureCollectionExists(`${flow}Purposes`);
        createIndex(`${flow}Purposes`, "purposeUniqueName",
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

    if (flow === "Flow2") {
        /// indexes ////////////////
        await ensureCollectionExists(`${flow}Purposes`);
        createIndex(`${flow}Purposes`, "purposeUniqueName",
            { "name": 1 },
            { unique: true }
        );
        ////////////////////////////

        /// Create default purposes
        const defaultPurposes: string[] = ["Visit", "Meeting", "Delivery", "Others"];
        let purpose = await new Parse.Query(Flow2Purposes)
            .first();
        if (!purpose) {
            for(let p of defaultPurposes) {
                purpose = new Flow2Purposes({ name: p });
                await purpose.save();
            }
            console.log("<Default> Default Purposes created.");
        }
    }

})();