import { Config } from 'core/config.gen';
import { EventList } from 'core/events.gen';
import { serverReady } from 'core/pending-tasks';
import scheduler, { Schedulers, ScheduleTimeType } from 'core/scheduler-loader';
import { ScheduleHelper } from 'helpers/schedules/schedule-helper';
import { RoleList } from 'core/userRoles.gen';
import { O } from 'helpers/utility';


/// handle license renew //////////////////////
import licenseService from 'services/license';
import { ScheduleHelperV2 } from 'helpers/schedules/schedule-helper-v2';
import { EScheduleUnitRepeatType, EScheduleUnitRepeatEndType } from 'models/nodes';
export const kioskLicense = '00261';

async function checkLicense() {
    let kioskRole = await new Parse.Query(Parse.Role)
        .equalTo("name", RoleList.Kiosk)
        .first();

    let kioskCounts = await new Parse.Query(Parse.User)
        .equalTo("roles", kioskRole)
        .count();

    let license = await licenseService.getLicense();

    let totalCounts = O(license.summary[kioskLicense]).totalCount || 0;

    let kiosks = await new Parse.Query(Parse.User)
        .equalTo("roles", kioskRole)
        .find();

    for (let i=0; i<kiosks.length; ++i) {
        let kiosk = kiosks[i];
        let activated = i < totalCounts ? true : false;
        if (kiosk.attributes.data.activated === activated) continue;
        kiosk.attributes.data.activated = activated;
        kiosk.save({
            data: kiosk.attributes.data
        }, { useMasterKey: true });
    }
}
/// update license for every one hour
ScheduleHelperV2.observe({
    beginDate: new Date(1970, 0, 1, 0, 0, 0),
    endDate: new Date(1970, 0, 1, 0, 0, 10),
    fullDay: false,
    repeat: {
        type: EScheduleUnitRepeatType.Hour,
        value: 1,
        endType: EScheduleUnitRepeatEndType.NoStop
    }
}, "License Checker")
.subscribe(checkLicense);
///////////////////////////////////////////////


// import frs from './../../services/frs-service';
// import licenseService from 'services/license';
// export const kioskLicense = '00261';

// import { IssueCardDaily } from 'workspace/cgi-bin/visitors/flow-strict/__api__/issueCard';

// export async function makeScheduler(force: boolean = false) {
//     /// recycle previous schedulers
//     let prevSchedulers = await new Parse.Query(Schedulers)
//         .find();
//     if (!force && prevSchedulers.length > 0) return;
//     for (let prevScheduler of prevSchedulers) {
//         prevScheduler.destroy();
//     }

//     /// hook schedulers by events
//     let promises = [];
//     let schedulers = [];
//     let events = ["EventPreRegistrationComplete", "EventStrictCompleteCheckIn"];//, "EventInvitationComplete"];
//     let controllers = ["PreRegistrationComplete", "VisitorCheckedIn"];//, "PreRegistration"];
//     for (let key in events) {
//         let event = events[key];
//         let controller = controllers[key];
//         /// make controllers
//         let actions = [];
//         Config.sms.enable && actions.push({ controller: `ScheduleController.SMS.${controller}` });
//         Config.sgsms.enable && actions.push({ controller: `ScheduleController.SGSMS.${controller}` });
//         Config.smtp.enable && actions.push({ controller: `ScheduleController.Email.${controller}` });
//         // Config.smtp.enable && event === 'EventStrictCompleteCheckIn' && actions.push({ controller: `ScheduleController.Email.CompleteCheckIn` });

//         let scheduler = new Schedulers({
//             event: EventList[event],
//             actions
//         });
//         schedulers.push( scheduler );
//         promises.push( scheduler.save() );
//     }

//     // /// only on email
//     // let sr = new Schedulers({
//     //     event: EventList.EventStrictCompleteCheckIn,
//     //     actions: [ { controller: `ScheduleController.Email.CompleteCheckIn` } ]
//     // });
//     // promises.push( sr.save() );

//     await Promise.all(promises);

//     scheduler.unregisterAll();
//     scheduler.register(schedulers);
// }

// (async () => {
//     await serverReady;

//     await makeScheduler();

//     async function checkLicense() {
//         let kioskRole = await new Parse.Query(Parse.Role)
//             .equalTo("name", RoleList.Kiosk)
//             .first();

//         let kioskCounts = await new Parse.Query(Parse.User)
//             .equalTo("roles", kioskRole)
//             .count();

//         let license = await licenseService.getLicense();

//         /// todo: remake O
//         //let totalCounts = O(license.summary[kioskLicense]).totalCount || 0;
//         let totalCounts = 0;
//         let summary = license.summary[kioskLicense];
//         if (summary) totalCounts = summary.totalCount;

//         let kiosks = await new Parse.Query(Parse.User)
//             .equalTo("roles", kioskRole)
//             .find();

//         for (let i=0; i<kiosks.length; ++i) {
//             let kiosk = kiosks[i];
//             kiosk.attributes.data.activated = i < totalCounts ? true : false;
//             kiosk.save({
//                 data: kiosk.attributes.data
//             }, { useMasterKey: true });
//         }
//     }

//     ScheduleHelper.scheduleObservable({
//         type: ScheduleTimeType.Minute,
//         triggerInterval: 60*60*1000,
//         start: new Date(1970, 0, 1, 0, 0, 0),
//         end: new Date(1970, 0, 1, 0, 1, 0)
//     }, true)
//     .subscribe( checkLicense );

//     ScheduleHelper.scheduleObservable({
//         type: ScheduleTimeType.Day,
//         triggerInterval: 24*60*60*1000,
//         start: new Date(1970, 0, 1, 0, 0, 0),
//         end: new Date(1970, 0, 1, 1, 0, 0)
//     }, true)
//     .subscribe( (a) => {
//         (async () => {
//             /// remove from FRS
//             /// x1) get all groups
//             /// x1.1) find visitor group. if no go 1.2)
//             /// 2) get all person
//             /// 2.1) find all in Visitor group and remove

//             /// 2)
//             let persons;
//             do {
//                 try {
//                     persons = await frs.getPersonList();
//                     break;
//                 } catch(e) {
//                     console.log(`FRS: ${e}`);
//                 }
//             } while(1);

//             /// 2.1)
//             for (let person of persons) {
//                 let groupid = person.groups.reduce((final, value) => {
//                     if (final) return final;
//                     if (value.name === 'Visitor') return value.group_id;
//                     return final;
//                 }, undefined);

//                 if (groupid) {
//                     await frs.deletePerson(person.person_id);
//                 }
//             }

//             /// daily issue cards
//             // 3) At Everyday 00:00 or when Server Restart
//             // 	3.1) Check (A) for outdated data, and then remove (B) (A)
//             IssueCardDaily();            

//         })();

//     });

// // /// Schedule - PreRegistrationComplete
// // scheduler.register(new Schedulers({
// //     event: EventList.EventPreRegistrationComplete,
// //     actions: [
// //         { controller: "ScheduleController.Email.PreRegistrationComplete" },
// //         { controller: "ScheduleController.SMS.PreRegistrationComplete" }
// //     ]
// // }));

// // /// Schedule - Visitor Checked-In
// // scheduler.register(new Schedulers({
// //     event: EventList.EventStrictCompleteCheckIn,
// //     actions: [
// //         { controller: "ScheduleController.Email.VisitorCheckedIn" },
// //         { controller: "ScheduleController.SMS.VisitorCheckedIn" }
// //     ]
// // }));

// // /// Schedule - Invitation Complete
// // scheduler.register(new Schedulers({
// //     event: EventList.EventInvitationComplete,
// //     actions: [
// //         { controller: "ScheduleController.Email.PreRegistration" },
// //         { controller: "ScheduleController.SMS.PreRegistration" }
// //     ]
// // }));

// })();

