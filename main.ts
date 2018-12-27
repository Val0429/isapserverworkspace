import { app } from 'core/main.gen';

// import './custom/schedulers/index';
// import './custom/shells/create-index';
import './custom/shells/auto-index';

import { Agent, ObjectID } from 'models/agents';
import './custom/agents';
import * as p from 'path';
import * as fs from 'fs';
import { screenShots } from './cgi-bin/test/screen';

console.log('agents?', JSON.stringify(Agent.all(), null, 2) );
import { FRSAgent } from './custom/agents/frs-agent';
import { WindowsAgent } from './custom/agents/windows-agent';
import { Restful } from 'helpers/cgi-helpers/core';
import { mouseEvents } from './cgi-bin/test/report';

// (async () => {
//     let frs = new FRSAgent({
//         frs: {
//             ip: "172.16.10.88",
//             port: 8088,
//             wsport: 7077,
//             account: "val",
//             password: "123456"
//         }
//     }, {
//         name: new ObjectID().str,
//         agent: await new Parse.Query(Parse.User).equalTo("username", "Admin").first()
//     });
//     await frs.Start().toPromise();
//     let count = 0;
//     frs.SearchRecords({
//         starttime: new Date(2018, 11, 10, 0,0,0),
//         endtime: new Date(2018, 11, 10, 23,59,59)
//     }).subscribe( (data) => {
//         console.log(`got face, count: ${++count}.`);
//         console.log({...data, face_feature: undefined});
//     }, () => {}, () => console.log('search complete'));    
// })();


// (async () => {
//     let agent = new WindowsAgent(null, {
//         name: new ObjectID().str,
//         agent: await new Parse.Query(Parse.User).equalTo("username", "Admin").first()
//     });
//     await agent.Start().toPromise();

//     // /// List Directory
//     // agent.ListDirectory({
//     //     path: `C:\\`
//     // }).subscribe( (data) => {
//     //     console.log('paths', data);
//     // });

//     // /// Download File
//     // console.time('start download')
//     // agent.Download({
//     //     path: `C:\\123.jpg`
//     // }).subscribe( (data) => {
//     //     fs.writeFile(`D:\\tmp\\test${p.extname(data.path)}`, Buffer.from(data.data, 'base64'), () => {});
//     //     console.timeEnd('start download')
//     // });

//     agent.Desktop({interval: 300})
//         .subscribe( (image) => {
//             screenShots.next(image);
//         });
//     mouseEvents.subscribe( async (config) => {
//         await agent.TeamViewer(config).toPromise();
//     });

// })();




// Agent.ImAgent({
//     ip: "localhost",
//     port: 6060,
//     username: "Admin",
//     password: "123456"
// });
