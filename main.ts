import { app } from 'core/main.gen';

import './custom/shells/create-index';
import './custom/shells/auto-index';


import { createMongoDB } from 'helpers/parse-server/parse-helper';
import * as fs from 'fs';
import { FaceFeatureCompare } from './custom/modules/face-feature-compare';

(async () => {
    function _(name: string) {
        //return Buffer.from( fs.readFileSync(`${__dirname}/custom/features/${name}.feature`).toString(), "base64")
        return fs.readFileSync(`${__dirname}/custom/features/${name}.feature`)
    }

    var features = {
        alex: _("alex"),
        ben: _("ben"),
        charles: _("charles"),
        daus: _("daus"),
        ellie: _("ellie"),
        eugene: _("eugene"),
        eva: _("eva"),
        frank: _("frank"),
        george: _("george"),
        grace: _("grace"),
        griffin: _("griffin"),
        haochan: _("haochan"),
        ike: _("ike"),
        jack: _("jack"),
        jasmine: _("jasmine"),
        jay: _("jay"),
        kelvin: _("kelvin"),
        ken: _("ken"),
        kenzie: _("kenzie"),
        kevin: _("kevin"),
        markhsu: _("mark.hsu"),
        markleorna: _("mark.leorna"),
        min: _("min"),
        morrishsu: _("morris.hsu"),
        morrispeng: _("morris.peng"),
        neo: _("neo"),
        rack: _("rack"),
        rebecca: _("rebecca"),
        rex: _("rex"),
        tina: _("tina"),
        tinalin: _("tina.lin"),
        tom: _("tom"),
        tulip: _("tulip"),
        val: _("val"),
        wenming: _("wenming")
    };

    // /// single person rate ///
    // let person = "wenming";
    // let personFeature = features[person];
    // console.time(`${person} score`);
    // let result = [];
    // for (let key in features) {
    //     if (key === person) continue;
    //     let feature = features[key];
    //     result.push([key, FaceFeatureCompare.sync(personFeature, feature)]);
    // }
    // result.sort((a, b) => b[1]-a[1]);

    // for (let o of result) {
    //     console.log(`compare with ${o[0]}: ${o[1]}`);
    // }
    // console.timeEnd(`${person} score`);

    /// NxN rate ///
    let result = [];
    let keymap = {};
    const keys = Object.keys(features);
    const maxlength = 10;
    let count1 = 0;

    for (let i=0; i<maxlength; ++i) {
        let key1 = keys[i];
        for (let j=0; j<maxlength; ++j) {
            let key2 = keys[j];
            if (key1===key2) continue;
            let arykey = [key1, key2].sort();
            if (keymap[arykey.join("-")]) continue;
            keymap[arykey.join("-")] = true;
            result.push([...arykey, FaceFeatureCompare.sync(features[key1], features[key2])]);
        }
    }

    // for (let key1 in features) {
    //     if (count1 > length) break;
    //     let count2 = 0;
    //     for (let key2 in features) {
    //         if (count2 > length) break;
    //         if (key1 === key2) continue;
    //         let arykey = [key1, key2].sort();
    //         if (keymap[arykey.join("-")]) continue;
    //         keymap[arykey.join("-")] = true;
    //         result.push([...arykey, FaceFeatureCompare.sync(features[key1], features[key2])]);
    //         count2++;
    //     }
    //     count1++;
    // }
    result = result
        .sort((a, b) => b[2]-a[2]);
    for (let o of result) {
        //console.log(`compare ${o[0]} with ${o[1]}, score: ${o[2]}`);
        console.log(`${o[0]} ${o[1]} ${1-o[2]}`);
    }

    // var buf = Buffer.from("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", "base64");
    // console.log('length: ', buf.length);

    // const { client, db } = await createMongoDB();
    // // this.mongoClient = client;
    // // this.mongoDb = db;

    // let col = db.collection("Test");

    // // /// write
    // // let buffer = fs.readFileSync("C:\\test2.jpg");
    // // console.log('size:', buffer.length);
    // // let buffers = [];
    // // for (let i=0; i<50000; ++i) {
    // //     buffers.push({ buffer });
    // // }
    // // console.time("insert");
    // // await col.insertMany(buffers);
    // // console.timeEnd("insert");


    // /// read
    // console.time('find');
    // let result = await col.find().limit(10000).toArray();
    // console.log('length', result.length);
    // console.timeEnd('find');

    // console.time('find');
    // result = await col.find().skip(10000).limit(10000).toArray();
    // console.log('length', result.length);
    // console.timeEnd('find');



    // const { client, db } = await createMongoDB();
    // const { client: client2, db: db2 } = await createMongoDB();
    // const { client: client3, db: db3 } = await createMongoDB();
    // const { client: client4, db: db4 } = await createMongoDB();
    // const { client: client5, db: db5 } = await createMongoDB();

    // let col = db.collection("Test");
    // let col2 = db2.collection("Test");
    // let col3 = db3.collection("Test");
    // let col4 = db4.collection("Test");
    // let col5 = db5.collection("Test");

    // async function getData(col, skip, limit) {
    //     // console.time(`time-${skip}-${limit}`);
    //     // let result = await col.find().skip(skip).limit(limit).toArray();
    //     // console.timeEnd(`time-${skip}-${limit}`);
    //     // return result;
    //     console.time(`time-${skip}-${limit}`);
    //     return new Promise( (resolve) => {
    //         let cursor = col.find().skip(skip).limit(limit);
    //         let result = [];
    //         cursor.on('data', (data) => result.push(data));
    //         cursor.on('end', () => {
    //             console.timeEnd(`time-${skip}-${limit}`);
    //             resolve(result);
    //         })
    //     });
    // }

    // console.time('start!');
    // await Promise.all([
    //     getData(col, 0, 10000),
    //     getData(col2, 10000, 10000),
    //     getData(col3, 20000, 10000),
    //     getData(col4, 30000, 10000),
    //     getData(col5, 40000, 10000),
    // ]);
    // console.timeEnd('start!');


    // console.time('start2!');
    // await getData(col, 0, 50000);
    // console.timeEnd('start2!');

    // console.time('start3!');
    // await Promise.all([
    //     getData(col, 0, 8300),
    //     getData(col2, 8300, 8300),
    //     getData(col, 16600, 8300),
    //     getData(col2, 24900, 8300),
    //     getData(col, 33200, 8300),
    //     getData(col2, 41500, 8500),
    // ]);
    // console.timeEnd('start3!');

    // console.time('start4!');
    // await Promise.all([
    //     getData(col, 0, 8300),
    //     getData(col2, 8300, 8300),
    //     getData(col3, 16600, 8300),
    //     getData(col, 24900, 8300),
    //     getData(col2, 33200, 8300),
    //     getData(col3, 41500, 8500),
    // ]);
    // console.timeEnd('start4!');

})();