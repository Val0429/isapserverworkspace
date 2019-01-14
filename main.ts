import { app } from 'core/main.gen';

// import './custom/schedulers/index';
// import './custom/shells/create-index';
import './custom/shells/auto-index';




import { Agent } from 'models/agents';
import './custom/agents';
import { WindowsAgent } from './custom/agents';
import { Observable } from 'rxjs';
import { ParseObject } from 'core/cgi-package';
import { FunctionRemote } from 'models/agents/libs';
// import * as p from 'path';
// import * as fs from 'fs';
// import { screenShots } from './cgi-bin/test/screen';

// import { FRSAgent } from './custom/agents/frs-agent';
// import { WindowsAgent } from './custom/agents/windows-agent';

console.log('agents?', JSON.stringify(Agent.RegistrationDelegator.getAllAgentTaskDescriptors(), null, 2) );

// import { Restful } from 'helpers/cgi-helpers/core';
// import { mouseEvents } from './cgi-bin/test/report';
// import { FacebookUtils } from 'parse';

// import { ObjectID } from 'mongodb';

// let ob1 = new Observable( (observer) => {
//     console.log('init...')
//     setInterval( () => observer.next(new Date()), 1000 );
// })
// .finally( () => console.log('finally?!'))
// .share();

// let sup1 = ob1.subscribe( (data) => console.log('got', data));
// let sup2 = ob1.subscribe( (data) => console.log('got', data));
// setTimeout( () => {
//     sup1.unsubscribe();
//     sup2.unsubscribe();
// }, 2000);


Agent.SocketManager.sharedInstance().sjCheckedIn
    .filter( (v) => v.get("username") === "Admin" )
    // .first()
    .subscribe( async (user) => {
        // let frs = new WindowsAgent(null, {
        //     user,
        //     syncDB: false
        // });
        // await frs.Start().toPromise();

        // let tt = FunctionRemote(frs.FreeMemory, frs)(null, {
        //     filter: {
        //         type: "FilterFunction",
        //         data: {
        //             ata: "return value.value % 1 === 0 ? true : false"
        //         }
        //     } as any,
        //     scheduler: {
        //         type: "SchedulerInterval",
        //         data: {
        //             initialDelayMs: 1000,
        //             periodMs: 1000
        //         }
        //     },
        // });
        // tt.subscribe( (free) => console.log('free memory: ', free), (e) => {
        //         console.log("Error", e);
        //     } );


        // let subscription = frs.FreeMemory()
        //     .subscribe( (free) => console.log('free memory: ', free), (e) => {
        //         console.log("Error", e);
        //         subscription.unsubscribe();
        //     } );
        // setTimeout( () => {
        //     subscription.unsubscribe();
        // }, 5000 );

        // let subscription = FunctionRemote(frs.FreeMemory, frs)(null, {
        //     filter: { type: "FilterJSONata", data: {
        //         ata: "$number(value)%20=0?{'value': value}:null"
        //     } }
        // })
        //     .subscribe( (free) => console.log('free memory: ', free), (e) => {
        //         console.log("Error", e);
        //         subscription.unsubscribe();
        //     } );

        // let subscription = FunctionRemote(frs.FreeMemory, frs)(null, {
        //     filter: {
        //         type: "FilterFunction",
        //         data: {
        //             func: "return value.value % 1 === 0 ? true : false"
        //         }
        //     },
        //     scheduler: {
        //         type: "SchedulerInterval",
        //         data: {
        //             initialDelayMs: 1000,
        //             periodMs: 3000
        //         }
        //     }
        // })
        //     .subscribe( (free) => console.log('free memory: ', free), (e) => {
        //         console.log("Error", e);
        //         subscription.unsubscribe();
        //     } );


        // let ob = frs.FreeMemory2();
        // // (frs as any)["FreeMemory"](null, {
        // //     filter: { type: "FilterJSONata", data: { ata: "$number(value)%2=0?{'value': value}:null" } }
        // // })
        // let sub1 = ob.subscribe( (free) => console.log('free memory: ', free), (e) => {
        //         console.log("Error", e);
        //         sub1.unsubscribe();
        //     } );
        // let sub2 = ob.subscribe( (free) => {
        //     sub2.unsubscribe();
        // }, e => null);

    });

// Agent.Job.sharedInstance().sjCheckIn
//     .filter( (v) => v.user.get("username") === "Admin")
//     .first()
//     .subscribe(async () => {

//     try {
//         let frs = new WindowsAgent(null, {
//             agent: await new Parse.Query(Parse.User).equalTo("username", "Admin").first(),
//             syncDB: true
//         });
    
//         await frs.Start().toPromise();
//         frs.FreeMemory()
//             .subscribe( (free) => console.log('free memory: ', free));
//         //frs.
//         // let count = 0;
//         // frs.SearchRecords({
//         //     starttime: new Date(2018, 11, 10, 0,0,0),
//         //     endtime: new Date(2018, 11, 10, 23,59,59)
//         // }).subscribe( (data) => {
//         //     console.log(`got face, count: ${++count}.`);
//         //     console.log({...data, face_feature: undefined});
//         // }, () => {}, () => console.log('search complete')); 

//     } catch(e) {
//         console.log('catched', e);
//     }

//     });



// Agent.Job.sharedInstance().sjCheckIn
//     .filter( (v) => v.user.get("username") === "Admin")
//     .first()
//     .subscribe(async () => {

//     try {
//         let frs = new FRSAgent({
//             frs: {
//                 ip: "172.16.10.88",
//                 port: 8088,
//                 wsport: 7077,
//                 account: "val",
//                 password: "123456"
//             }
//         }, {
//             agent: await new Parse.Query(Parse.User).equalTo("username", "Admin").first(),
//             syncDB: true
//         });
    
//         await frs.Start().toPromise();
//         let count = 0;
//         frs.SearchRecords({
//             starttime: new Date(2018, 11, 10, 0,0,0),
//             endtime: new Date(2018, 11, 10, 23,59,59)
//         }).subscribe( (data) => {
//             console.log(`got face, count: ${++count}.`);
//             console.log({...data, face_feature: undefined});
//         }, () => {}, () => console.log('search complete')); 

//     } catch(e) {
//         console.log('catched', e);
//     }

//     });


    
// setTimeout( () => {
// (async () => { try {

//     let frs = new FRSAgent({
//         frs: {
//             ip: "172.16.10.88",
//             port: 8088,
//             wsport: 7077,
//             account: "val",
//             password: "123456"
//         }
//     }, {
//         name: shortid.generate(),
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

// } catch(e) {
//     console.log('catched', e);
// }

// })();
// }, 6000);

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

/// Server: Provide cgi-bin/agents/connect, for agents to connect
/// after agent connected, asking tasks, send back
//Agent.ImServer();


/// Senario1: auto hook
/// 1) Load from DB
/// 2) Start Agent with tasks
/// 2.1) Every Agent / Task should have their unique ObjectID(name)
// let frs = new FRSAgent({
//     frs: {
//         ip: "172.16.10.88",
//         port: 8088,
//         wsport: 7077,
//         account: "val",
//         password: "123456"
//     }
// }, {
//     name: new ObjectID().str,
//     agent: await new Parse.Query(Parse.User).equalTo("username", "Admin").first()
// });
// frs.EnableLiveFaces({ enable: true })
//     .subscribe( (face) => {
//         new Face(face).save();
//     })

// /// Senario2: programming hook
// let frs = new FRSAgent({
//     ip, port ,wsport, account, password
// }, { name: new UniqueName(), agent });

// let frs = new FRSAgent({
//     ip, port ,wsport, account, password
// }, { name: new AnyName(), agent });
