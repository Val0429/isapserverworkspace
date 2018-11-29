import { serverReady } from 'core/pending-tasks';
import { createIndex, sharedMongoDB } from 'helpers/parse-server/parse-helper';
import { Config } from 'core/config.gen';
import { Log } from 'helpers/utility';

(async () => {
    await serverReady;

    /// indexes ////////////////
    /// Visitors
    createIndex("Visitors", "uniquePhonePlusEmail",
        { "company": 1, "phone": 1, "email": 1 },
        { unique: true }
    );

    if (Config.vms.visitorExpireEnabled) {
        let days = Config.vms.visitorExpireDay;
        /// create touchDate TTL
        const magicString = "TTLTouchDate";
        let db = await sharedMongoDB();
        let instance = db.collection("Visitors");
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
                Log.Info("Dropping Index", `Drop Old Visitor Recycle Index...`);
                await instance.dropIndex(touchDateIdx);
                /// create new index
                createIndex("Visitors", `${magicString}${days}`,
                    { "touchDate": 1 },
                    { expireAfterSeconds: days*24*60*60 }
                );
            }
        } else {
            /// create new index
            createIndex("Visitors", `${magicString}${days}`,
                { "touchDate": 1 },
                { expireAfterSeconds: days*24*60*60 }
            );
        }

    }

    // for (let key in indexes) {
    //     let index = indexes[key];
    //     console.log(`index: ${JSON.stringify(index)}`);
    // }

    // let db = await sharedMongoDB();

    // var instance = db.collection(collectionName);
    // try {
    //     if (!await instance.indexExists(indexName)) throw null;
    // } catch(reason) {
    //     var showname = collectionName.replace(/^\_/, '');
    //     Log.Info("Indexing", `Make index on <${showname}.${indexName}>.`);
    //     instance.createIndex(fieldOrSpec, {background: true, name: indexName, ...options});
    // }

    ////////////////////////////
})();