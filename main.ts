import { app } from './../core/main.gen';

//import './custom/schedulers/index';
import './custom/shells/index';

// import './custom/services/frs-service';
// import 'services/pin-code/pin-code';

import { Config } from 'core/config.gen';

import { FRSService } from './custom/services/frs-service';
import './custom/services/frs-service/modules/snapshot';
import './custom/services/frs-service/modules/live-faces';
import './custom/services/frs-service/modules/search-records';
import { UnRecognizedUser } from 'workspace/custom/services/frs-service/libs/core';
import { Log } from 'helpers/utility';

let frs = new FRSService({
    frs: {
        ip: '172.16.10.88',
        port: 8088,
        wsport: 7077,
        account: "val",
        password: "123456"
    },
    debug: true
});
frs.start();
// frs.enableLiveFaces(true);
// frs.sjLiveStream.subscribe( (face) => {
//     console.log('got face!', {...face, face_feature: undefined});
// });
// frs.enableFilterFaces(true);
// frs.sjLiveHandledFace.subscribe( (face) => {
//     console.log('got face!', {...face, face_feature: undefined});
// });
let count = 0;
frs.searchRecords(new Date(2018, 11, 10, 0, 0, 0), new Date(2018,11,10,23,59,59))
    /// Location Filter
    // .filter( (v) =>  )
    .subscribe( (face) => {
        console.log('face', {...face, face_feature: undefined});
        //console.log('face count', count++)
    })



// let face: UnRecognizedUser = { type: 0,
//     action_enable: 1,
//     snapshot: 'i1544410825913_c206ca1796c517b5.jpg',
//     channel: 'Camera_04_01',
//     timestamp: 1544410825914,
//     request_client_param: 'jpdo4islQ3zdEsFxrE4fymBk',
//     target_score: 0.9,
//     verify_face_id: '5c0dd6c99c236054c722d7b3',
//     highest_score: { fullname: "Val", face_id_number: "", score: 0 },
//     face_feature: undefined };

// setInterval( () => {
//     frs.snapshot(face)
//     //.then( (value) => console.log('get value!', value.length))
//     .then( (value) => Log.Info("snapshot", `get value! ${value.length}`) )
//     .catch( (err) => console.log('error', err))
// }, 1000);


// setTimeout( () => {
//     frs.enableLiveFaces(false);
//     setTimeout( () => {
//         frs.enableLiveFaces(true);
//     }, 5000);
// }, 10000);

// let frs = new FRSService({
//     frs: {
//         ip: '172.16.10.88',
//         port: 8088,
//         wsport: 7077,
//         account: "Admin",
//         password: "123456"
//     }
// });
// (async () => {
//     frs.start();
//     frs.enableLiveFaces(true);
//     frs.sjLiveStream.subscribe( (face) => {
//         console.log('got face!', {...face, face_feature: undefined});
//     })
// })();
