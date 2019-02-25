import { app } from 'core/main.gen';
import { ParseObject, registerSubclass } from 'helpers/cgi-helpers/core';
import { serverReady } from 'core/pending-tasks';
import { reject } from 'bluebird';


import { Tree } from 'models/nodes/tree';
import { pickObject } from 'helpers/utility/pick-object';
import { Permission } from 'models/nodes/permission';
import { Log, Level } from 'helpers/utility';
import { Schedule, EScheduleUnitRepeatType, EScheduleUnitRepeatEndType, ISchedule, EScheduleUnitRepeatMonthType } from 'models/nodes/schedule';
import { CacheParse } from 'helpers/parse-server/cache-helper';

// import './custom/schedulers/index';
// import './custom/shells/create-index';
// import './custom/shells/auto-index';

/// make person
interface IPerson {
    name: string;
    intro?: string;
}
@registerSubclass({memoryCache: true, container: false}) export class Person extends Tree<IPerson> {}

/// make group
interface IGroup {
    name: string;
}
@registerSubclass({memoryCache: true, container: true}) export class Group extends Tree<IGroup> {}

/// make region
interface IRegion {
    name: string;
    description: string;
}
@registerSubclass({memoryCache: true, container: true}) export class Region extends Tree<IRegion> {}

@registerSubclass({memoryCache: true}) export class RegionPersonSchedule extends Schedule.Of({who: Person, where: Region}) {}
@registerSubclass({memoryCache: true}) export class RegionBasicSchedule extends Schedule.Of({where: Region}) {}

/// make permission
// enum EAccessRight {
//     Access = 0x1,
//     Alert = 0x2,
//     AutoAirCondition = 0x4
// }
// interface IRegionPermission {
//     access?: EAccessRight;
// }
// @registerSubclass({memoryCache: true}) export class RegionPermission extends Permission.Of(Region).With<IRegionPermission>().On(Person, Group) {}

// @registerSubclass({memoryCache: true}) export class RegionPermission extends Permission.Of(Region).With<IRegionPermission>().On(RegionPersonSchedule, Person, Group, RegionBasicSchedule) {}

let extract = (message) => {
    if (!message) return "undefined";
    let msgs = [];
    ((message & 0x1) > 0) && (msgs.push('Open Door'));
    ((message & 0x2) > 0) && (msgs.push('Send Email to HR'));
    ((message & 0x4) > 0) && (msgs.push('Auto Open Air Condition'));
    ((message & 0x8) > 0) && (msgs.push('Always have access to open door'));
    return msgs.join(" & ");
}


// (async () => {

//     await serverReady;

//     let person = await new Parse.Query(Person).equalTo("name", "Min").first();
//     let personFrank = await new Parse.Query(Person).equalTo("name", "Frank").first();
//     let region = await new Parse.Query(Region).equalTo("name", "Taipei").first();
//     let regionBeitou = await new Parse.Query(Region).equalTo("name", "Beitou").first();
//     let group = await new Parse.Query(Group).equalTo("name", "Super VIP").first();

//     // let rpsDay = new RegionBasicSchedule({
//     //     where: region,
//     //     when: {
//     //         beginDate: new Date(2019, 0, 1, 8, 0, 0),
//     //         endDate: new Date(2019, 0, 1, 18, 0, 0),
//     //         fullDay: false,
//     //         repeat: {
//     //             type: EScheduleUnitRepeatType.Week,
//     //             value: 1,
//     //             data: [1,2,3,4,5],
//     //             endType: EScheduleUnitRepeatEndType.NoStop
//     //         }
//     //     }
//     // });
//     // await rpsDay.save();
//     // let rpsNight = new RegionBasicSchedule({
//     //     where: region,
//     //     when: {
//     //         beginDate: new Date(2019, 0, 1, 18, 0, 0),
//     //         endDate: new Date(2019, 0, 2, 8, 0, 0),
//     //         fullDay: false,
//     //         repeat: {
//     //             type: EScheduleUnitRepeatType.Week,
//     //             value: 1,
//     //             data: [1,2,3,4,5],
//     //             endType: EScheduleUnitRepeatEndType.NoStop
//     //         }
//     //     }
//     // });
//     // await rpsNight.save();
//     // let rpsOff = new RegionBasicSchedule({
//     //     where: region,
//     //     when: {
//     //         beginDate: new Date(2019,0,5,0,0,0),
//     //         endDate: new Date(2019,0,7,0,0,0),
//     //         fullDay: false,
//     //         repeat: {
//     //             type: EScheduleUnitRepeatType.Week,
//     //             value: 1,
//     //             data: [6],
//     //             endType: EScheduleUnitRepeatEndType.NoStop
//     //         }
//     //     },
//     //     priority: 60
//     // });
//     // await rpsOff.save();
//     // await RegionPermission.set(region, rpsDay, "access", EAccessRight.Access);
//     // await RegionPermission.set(region, rpsNight, "access", EAccessRight.Access | EAccessRight.Alert);
//     // await RegionPermission.set(region, rpsOff, "access", EAccessRight.Alert);

//     // let rpsFrankDay = new RegionPersonSchedule({
//     //     who: personFrank,
//     //     where: region,
//     //     when: {
//     //         beginDate: new Date(2019, 0, 1, 8, 0, 0),
//     //         endDate: new Date(2019, 0, 1, 18, 0, 0),
//     //         fullDay: false,
//     //         repeat: {
//     //             type: EScheduleUnitRepeatType.Week,
//     //             value: 1,
//     //             data: [1,2,3,4,5],
//     //             endType: EScheduleUnitRepeatEndType.NoStop
//     //         }
//     //     }
//     // });
//     // await rpsFrankDay.save();
//     // let rpsFrankNight = new RegionPersonSchedule({
//     //     who: personFrank,
//     //     where: region,
//     //     when: {
//     //         beginDate: new Date(2019, 0, 1, 18, 0, 0),
//     //         endDate: new Date(2019, 0, 2, 8, 0, 0),
//     //         fullDay: false,
//     //         repeat: {
//     //             type: EScheduleUnitRepeatType.Week,
//     //             value: 1,
//     //             data: [1,2,3,4,5],
//     //             endType: EScheduleUnitRepeatEndType.NoStop
//     //         }
//     //     }
//     // });
//     // await rpsFrankNight.save();
//     // await RegionPermission.set(region, rpsFrankDay, "access", EAccessRight.Access | EAccessRight.AutoAirCondition);
//     // await RegionPermission.set(region, rpsFrankNight, "access", EAccessRight.Access);

//     //await RegionPermission.set(region, person, "access", EAccessRight.Access | EAccessRight.Alert | EAccessRight.AutoAirCondition);

//     Log.TraceTime('Main', 'time for permission verify')
//     let promises = [];
//     let CParse = new CacheParse();
//     for (let i=0; i<1000; ++i) {
//         promises.push( RegionPermission.verify(region, person, "access", { date: new Date(2019,1,15,7,0,0), CParse }) );
//     }
//     await Promise.all(promises);
//     CParse.dispose();
//     Log.TraceTimeEnd('Main', 'time for permission verify')


//     // Log.TraceTime('Main', 'time for permission verify')
//     // let result = await RegionPermission.verify(region, personFrank, "access", { date: new Date(2019,1,15,7,0,0) });
//     // Log.TraceTimeEnd('Main', 'time for permission verify')
//     // console.log('final result!', result);

//     Log.TraceTime('Main', 'time for permission verify')
//     let result2 = await RegionPermission.verify(regionBeitou, person, "access", { date: new Date(2019,1,15,7,0,0) });
//     Log.TraceTimeEnd('Main', 'time for permission verify')
//     console.log('final result!', result2);

//     // // console.time('time for permission verify')
//     // // result = await RegionPermission.verify(region, person, "read");
//     // // console.timeEnd('time for permission verify')

//     // let cal = await RegionPersonSchedule.buildCalendar(person, { start: new Date(2019,1,16,7,0,0), end: new Date(2019,1,16,7,0,0) });
//     // console.log('Cal!', cal)
//     // console.log('Cal!', cal.matchTime(new Date(2019,1,16,7,0,0)));

// })();

// (async () => {

//     try {
//         let rroot = await Region.getRoot();
//         if (!rroot) {
//             rroot = await Region.setRoot({ name: "Taiwan", description: "" });
//             rroot.addLeaf({name: "Keelong", description: ""});
//             rroot.addLeaf({name: "Kaohsiung", description: ""});
//             rroot.addLeaf({name: "Taoyuan", description: ""});
            
//             let taipei = await rroot.addLeaf({name: "Taipei", description: ""});
//             taipei.addLeaf({name: "Datong", description: ""});
//             taipei.addLeaf({name: "Beitou", description: ""});

//             let songshan = await taipei.addLeaf({name: "Sungshan", description: ""});
//             songshan.addLeaf({name: "Mingshan", description: ""});
//             songshan.addLeaf({name: "Nanjing", description: ""});
//             songshan.addLeaf({name: "Songshan Train Station", description: ""});
//         }

//         let proot = await Person.getRoot();
//         if (!proot) {
//             proot = await Person.setRoot({ name: "Kelvin" });
//             proot.addLeaf({ name: "Ken" });
//             proot.addLeaf({ name: "Alex" });
//             proot.addLeaf({ name: "Jasmine" });

//             let frank = await proot.addLeaf({ name: "Frank" });
//             frank.addLeaf({ name: "Tulip" });
//             frank.addLeaf({ name: "Mark" });

//             let val = await frank.addLeaf({ name: "Val" });
//             val.addLeaf({ name: "Min" });
//             val.addLeaf({ name: "Tom" });
//         }

//         let groot = await Group.getRoot();
//         if (!groot) {
//             groot = await Group.setRoot({ name: "VIP" });
//             groot.addLeaf({ name: "Super VIP" });
//             groot.addLeaf({ name: "Normal VIP" });
//         }

//         let PersonMin = await new Parse.Query(Person)
//             .equalTo("name", "Min")
//             .first();
//         let RegionTaipei = await new Parse.Query(Region)
//             .equalTo("name", "Taipei")
//             .first();
//         // /// 每周日一重複的整天事件
//         // let rps = new RegionPersonSchedule({
//         //     who: PersonMin,
//         //     where: RegionTaipei,
//         //     when: {
//         //         beginDate: new Date(2019, 4, 12, 16, 0, 0),
//         //         endDate: new Date(2019, 4, 12, 17, 0, 0),
//         //         fullDay: false,
//         //         repeat: {
//         //             type: EScheduleUnitRepeatType.Year,
//         //             value: 1,
//         //             data: EScheduleUnitRepeatMonthType.ByWeekday,
//         //             endType: EScheduleUnitRepeatEndType.NoStop
//         //         }
//         //     }
//         // });
//         // await rps.save();
//         // let cal = await RegionPersonSchedule.buildCalendar(PersonMin, { start: new Date(2018, 11, 29, 0,0,0,0), end: new Date(2030,1,5,0,0,0,0) });
//         // console.log('Cal!', cal.matchTime(new Date(2019,4,12,16,30,0)));

//     } catch(e) { console.log('catched', JSON.stringify(e)) }

// })();


// /// Case 1: Person & Group
// interface IRegionPermission {
//     message?: string;
// }
// @registerSubclass({memoryCache: true}) export class RegionPermission extends Permission.Of(Region).With<IRegionPermission>().On(Person, Group) {}
// (async () => {

//     await serverReady;

//     let personVal = await new Parse.Query(Person).equalTo("name", "Val").first();
//     let personFrank = await new Parse.Query(Person).equalTo("name", "Frank").first();
//     let group = await new Parse.Query(Group).equalTo("name", "Super VIP").first();
//     let regionTaipei = await new Parse.Query(Region).equalTo("name", "Taipei").first();
//     let regionDatong = await new Parse.Query(Region).equalTo("name", "Datong").first();

//     if (await new Parse.Query(RegionPermission).count() === 0) {
//         await RegionPermission.set(regionTaipei, personFrank, "message", "Frank has permission to entry Taipei");
//         await RegionPermission.set(regionDatong, group, "message", "Super VIP has permission to entry Datong");
//     }

//     let message;
//     const LogTitle = "Permission Test Info";
//     message = await RegionPermission.verify(regionDatong, [personFrank, group], "message");
//     Log.Info(LogTitle, `Frank enter Datong: ${message}`);
//     message = await RegionPermission.verify(regionDatong, [personVal, group], "message");
//     Log.Info(LogTitle, `Val enter Datong: ${message}`);
// })();


/// Case 2: RegionPersonSchedule & Person
enum EAccessRight {
    Access = 0x1,
    Alert = 0x2,
    AutoAirCondition = 0x4,
    AlwaysAccess = 0x8
}
interface IRegionPermission {
    access?: EAccessRight;
    access2?: boolean;
}
@registerSubclass({memoryCache: true}) export class RegionPermission extends Permission.Of(Region).With<IRegionPermission>().On(RegionPersonSchedule, Person, Group, RegionBasicSchedule) {}
(async () => {

    await serverReady;
    let personVal = await new Parse.Query(Person).equalTo("name", "Val").first();
    let personMin = await new Parse.Query(Person).equalTo("name", "Min").first();
    let personFrank = await new Parse.Query(Person).equalTo("name", "Frank").first();
    let regionTaipei = await new Parse.Query(Region).equalTo("name", "Taipei").first();
    let regionBeitou = await new Parse.Query(Region).equalTo("name", "Beitou").first();
    let group = await new Parse.Query(Group).equalTo("name", "Super VIP").first();

    /// 2) Setup Frank Schedule
    if (await new Parse.Query(RegionPermission).count() === 0) {
        await RegionPermission.set(regionTaipei, personFrank, "access", EAccessRight.AlwaysAccess);
    }
    
    /// 1) Setup Val Schedule
    if (await new Parse.Query(RegionPersonSchedule).count() === 0) {
        let rpsDay = new RegionPersonSchedule({
            where: regionTaipei,
            who: personVal,
            when: {
                beginDate: new Date(2019, 0, 1, 8, 0, 0),
                endDate: new Date(2019, 0, 1, 18, 0, 0),
                fullDay: false,
                repeat: {
                    type: EScheduleUnitRepeatType.Week,
                    value: 1,
                    data: [1,2,3,4,5],
                    endType: EScheduleUnitRepeatEndType.NoStop
                }
            }
        });
        await rpsDay.save();
        let rpsNight = new RegionPersonSchedule({
            where: regionTaipei,
            who: personVal,
            when: {
                beginDate: new Date(2019, 0, 1, 18, 0, 0),
                endDate: new Date(2019, 0, 2, 8, 0, 0),
                fullDay: false,
                repeat: {
                    type: EScheduleUnitRepeatType.Week,
                    value: 1,
                    data: [1,2,3,4,5],
                    endType: EScheduleUnitRepeatEndType.NoStop
                }
            }
        });
        await rpsNight.save();
        let rpsOff = new RegionPersonSchedule({
            where: regionTaipei,
            who: personVal,
            when: {
                beginDate: new Date(2019,0,5,0,0,0),
                endDate: new Date(2019,0,7,0,0,0),
                fullDay: false,
                repeat: {
                    type: EScheduleUnitRepeatType.Week,
                    value: 1,
                    data: [6],
                    endType: EScheduleUnitRepeatEndType.NoStop
                }
            },
            priority: 60
        });
        await rpsOff.save();

        await RegionPermission.set(regionTaipei, rpsDay, "access", EAccessRight.Access);
        await RegionPermission.set(regionTaipei, rpsNight, "access", EAccessRight.Access | EAccessRight.Alert);
        await RegionPermission.set(regionTaipei, rpsOff, "access", EAccessRight.Alert);
    }

    /// 3) Setup Basic Schedule
    if (await new Parse.Query(RegionBasicSchedule).count() === 0) {
        let rpsDay = new RegionBasicSchedule({
            where: regionTaipei,
            when: {
                beginDate: new Date(2019, 0, 1, 8, 0, 0),
                endDate: new Date(2019, 0, 1, 18, 0, 0),
                fullDay: false,
                repeat: {
                    type: EScheduleUnitRepeatType.Week,
                    value: 1,
                    data: [1,2,3,4,5],
                    endType: EScheduleUnitRepeatEndType.NoStop
                }
            }
        });
        await rpsDay.save();
        let rpsNight = new RegionBasicSchedule({
            where: regionTaipei,
            when: {
                beginDate: new Date(2019, 0, 1, 18, 0, 0),
                endDate: new Date(2019, 0, 2, 8, 0, 0),
                fullDay: false,
                repeat: {
                    type: EScheduleUnitRepeatType.Week,
                    value: 1,
                    data: [1,2,3,4,5],
                    endType: EScheduleUnitRepeatEndType.NoStop
                }
            }
        });
        await rpsNight.save();
        let rpsOff = new RegionBasicSchedule({
            where: regionTaipei,
            when: {
                beginDate: new Date(2019,0,5,0,0,0),
                endDate: new Date(2019,0,7,0,0,0),
                fullDay: false,
                repeat: {
                    type: EScheduleUnitRepeatType.Week,
                    value: 1,
                    data: [6],
                    endType: EScheduleUnitRepeatEndType.NoStop
                }
            },
            priority: 60
        });
        await rpsOff.save();

        await RegionPermission.set(regionTaipei, rpsDay, "access", EAccessRight.Access);
        await RegionPermission.set(regionTaipei, rpsNight, "access", EAccessRight.Access | EAccessRight.Alert);
        await RegionPermission.set(regionTaipei, rpsOff, "access", EAccessRight.Alert);
    }

    const LogTitle = "Permission Test Info";

    let CParse = new CacheParse();
    await CParse.Query(Person).find();
    await CParse.Query(Region).find();
    await CParse.Query(RegionPermission).find();
    await CParse.Query(Group).find();
    await CParse.Query(RegionPersonSchedule).find();
    await CParse.Query(RegionBasicSchedule).find();

    let message;
    let date = new Date(2019,1,15,7,0,0);
    //let date = new Date(2019,1,16,8,0,0);
    Log.InfoTime(LogTitle, "Cost time");
    for (let i=0; i<1; ++i) {
        // message = await RegionPermission.verify(regionBeitou, personVal, "access", { date, CParse });
        // Log.Info(LogTitle, `Val enter Beitou @${date.toLocaleString()}: ${extract(message.access)}`);
        // message = await RegionPermission.verify(regionBeitou, personFrank, "access", { date, CParse });
        // Log.Info(LogTitle, `Frank enter Beitou @${date.toLocaleString()}: ${extract(message.access)}`);
        // message = await RegionPermission.verify(regionBeitou, personMin, "access", { date, CParse });
        // Log.Info(LogTitle, `Min enter Beitou @${date.toLocaleString()}: ${extract(message.access)}`);

        message = await RegionPermission.verify(regionBeitou, personVal, { date, CParse });
        Log.Info(LogTitle, `Val enter Beitou @${date.toLocaleString()}: ${JSON.stringify(message)}`);
        message = await RegionPermission.verify(regionBeitou, personFrank, { date, CParse });
        Log.Info(LogTitle, `Frank enter Beitou @${date.toLocaleString()}: ${JSON.stringify(message)}`);
        message = await RegionPermission.verify(regionBeitou, personMin, { date, CParse });
        Log.Info(LogTitle, `Min enter Beitou @${date.toLocaleString()}: ${JSON.stringify(message)}`);

    }
    Log.InfoTimeEnd(LogTitle, "Cost time");

})();

