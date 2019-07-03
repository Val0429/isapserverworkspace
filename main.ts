import { app } from 'core/main.gen';

import './custom/shells/create-index';
import './custom/shells/auto-index';



import { FRSs, sjLiveStream } from './custom/models/frss';

FRSs.init();
sjLiveStream.subscribe( (data) => {
    console.log({ ...data, face: { ...data.face, face_feature: undefined } });
});

// (async () => {
//     let frs = new FRSService({
//         debug: true,
//         frs: {
//             ip: "172.16.10.134",
//             port: 80,
//             account: "Val",
//             password: "1"
//         }
//     });
//     frs.start();
//     frs.enableLiveFaces(true);
//     frs.sjLiveStream.subscribe( (data) => {
//         console.log('from 134', { ...data, face_feature: undefined });
//     });


//     let frs2 = new FRSService({
//         debug: true,
//         frs: {
//             ip: "172.16.10.149",
//             port: 80,
//             account: "Val",
//             password: "1"
//         }
//     });
//     frs2.start();
//     frs2.enableLiveFaces(true);
//     frs2.sjLiveStream.subscribe( (data) => {
//         console.log('from 149', { ...data, face_feature: undefined });
//     });


// })();