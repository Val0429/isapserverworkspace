import { app } from 'core/main.gen';

// import './custom/schedulers/index';
// import './custom/shells/create-index';
import './custom/shells/auto-index';




import { Agent } from 'models/agents';
import './custom/agents';
import { WindowsAgent } from './custom/agents';
import { Observable } from 'rxjs';
import { ParseObject } from 'core/cgi-package';
import { FunctionRemote, idGenerate } from 'models/agents/libs';
// import * as p from 'path';
// import * as fs from 'fs';
// import { screenShots } from './cgi-bin/test/screen';

// import { FRSAgent } from './custom/agents/frs-agent';
// import { WindowsAgent } from './custom/agents/windows-agent';

console.log('agents?', JSON.stringify(Agent.RegistrationDelegator.getAllAgentTaskDescriptors(), null, 2) );


// (async () => {
//     let user = await new Parse.Query(Parse.User)
//         .equalTo("username", "Admin")
//         .first();

//     let frs = new WindowsAgent(null, {
//         objectKey: "tEFebUdgn",
//         user,
//         syncDB: true
//     });

//     try {
//         await frs.Start().toPromise();
//     } catch(e) {}

//     let tt = FunctionRemote(frs.FreeMemory, frs)(null, {
//         requestKey: "09x3FxQZSY",
//         filter: {
//             type: "FilterFunction",
//             data: {
//                 func: "return value.value % 1 === 0 ? true : false"
//             }
//         },
//         scheduler: {
//             type: "SchedulerInterval",
//             data: {
//                 initialDelayMs: 1000,
//                 periodMs: 1000
//             }
//         },
//         dataKeeping: {
//             durationSeconds: 60
//         }
//     });
//     let subscription = tt.subscribe( (free) => console.log('free memory: ', free), (e) => {
//             console.log("Error", e);
//         }, () => console.log('complete!') );

//     setTimeout( () => {
//         console.log('tick!');
//         subscription.unsubscribe();
//         setTimeout( () => {
//             console.log('tick2!');
//             frs.Dispose().toPromise();
//         }, 5000)
//     }, 5000);

// })();



Agent.SocketManager.sharedInstance().sjCheckedIn
    .filter( (v) => v.get("username") === "Admin" )
    // .first()
    .subscribe( async (user) => {
        // let frs = new WindowsAgent(null, {
        //     user,
        //     objectKey: "tEFebUdgn",
        //     syncDB: false
        // });
        // await frs.Start().toPromise();

        // let tt = FunctionRemote(frs.FreeMemory, frs)(null, {
        //     requestKey: "09x3FxQZSY",
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
        //             periodMs: 1000
        //         }
        //     },
        //     dataKeeping: {
        //         durationSeconds: 60
        //     }
        // });
        // tt.subscribe( (free) => console.log('free memory: ', free), (e) => {
        //         console.log("Error", e);
        //     } );


        // let frs = new WindowsAgent(null, {
        //     user,
        //     objectKey: "tEFebUdgn",
        //     syncDB: false
        // });
        // await frs.Start().toPromise();

        // let tt = FunctionRemote(frs.Desktop, frs)(null, {
        //     requestKey: "09x3FxQZSY2",
        //     // filter: {
        //     //     type: "FilterFunction",
        //     //     data: {
        //     //         func: "return value.value % 1 === 0 ? true : false"
        //     //     }
        //     // },
        //     scheduler: {
        //         type: "SchedulerInterval",
        //         data: {
        //             initialDelayMs: 1000,
        //             periodMs: 1000
        //         }
        //     },
        //     // dataKeeping: {
        //     //     durationSeconds: 60
        //     // }
        // });
        // tt.subscribe( (image) => console.log('image: ', image.image.length), (e) => {
        //         console.log("Error", e);
        //     } );
        

    let frs = new WindowsAgent(null, {
        objectKey: "tEFebUdgn",
        user,
        syncDB: false
    });

    try {
        await frs.Start().toPromise();
    } catch(e) {}

    let tt = FunctionRemote(frs.FreeMemory, frs)(null, {
        requestKey: "09x3FxQZSY",
        filter: {
            type: "FilterFunction",
            data: {
                func: "return value.value % 1 === 0 ? true : false"
            }
        },
        scheduler: {
            type: "SchedulerInterval",
            data: {
                initialDelayMs: 1,
                periodMs: 1
            }
        },
        dataKeeping: {
            durationSeconds: 60
        }
    });
    let subscription = tt.subscribe( (free) => console.log('free memory: ', free), (e) => {
            console.log("Error", e);
        }, () => console.log('complete!') );


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
