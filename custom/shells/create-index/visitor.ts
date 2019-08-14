import { serverReady } from 'core/pending-tasks';
import { createIndex, sharedMongoDB } from 'helpers/parse-server/parse-helper';
import { Config } from 'core/config.gen';
import { Log } from 'helpers/utility';

(async () => {
    await serverReady;

    let flow = Config.vms.flow;

    if (flow === "Flow1") {
        /// indexes ////////////////
        if (Config.vms.workerExpiredDay) {
            let days = Config.vms.workerExpiredDay;
            let collection = `${flow}Privacies`;
            /// create touchDate TTL
            const magicString = "TTLUpdatedDate";
            let db = await sharedMongoDB();
            let instance = db.collection(collection);
            let indexes = await instance.listIndexes().toArray();
            let touchDateIdx: string = indexes.reduce( (final, value) => {
                if (final) return final;
                if (new RegExp(`^${magicString}`).test(value.name)) return value.name;
                return final;
            }, undefined);
            /// if exists, check day
            if (touchDateIdx) {
                let result: number = +touchDateIdx.match( new RegExp(`^${magicString}([0-9]+)`) )[1];
                if (days !== result) {
                    /// drop old index
                    Log.Info("Dropping Index", `Drop Old Privacy Recycle Index...`);
                    await instance.dropIndex(touchDateIdx);
                    /// create new index
                    createIndex(collection, `${magicString}${days}`,
                        { "_updated_at": 1 },
                        { expireAfterSeconds: days*24*60*60 }
                    );
                }
            } else {
                /// create new index
                createIndex(collection, `${magicString}${days}`,
                    { "_updated_at": 1 },
                    { expireAfterSeconds: days*24*60*60 }
                );
            }
        }

        ////////////////////////////
    }
})();