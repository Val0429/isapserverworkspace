import { app } from './../core/main.gen';

//import './custom/schedulers/index';
import './custom/shells/index';

// import './custom/services/frs-service';
// import 'services/pin-code/pin-code';

import { Config } from 'core/config.gen';
import { FRSService } from './custom/services/frs-service';

let frs = new FRSService({
    frs: {
        ip: '172.16.10.31',
        port: 8088,
        wsport: 7077,
        account: "Admin",
        password: "123456"
    }
});
import './custom/services/frs-service/modules/snapshot';
(async () => {
    console.log('???')
    console.log('snapshot?', await frs.snapshot("123"))
})();

// let frs2 = new FRSService({
//     frs: {
//         ip: '172.16.10.88',
//         port: 8088,
//         wsport: 7077,
//         account: "Admin",
//         password: "123456"
//     }
// });
