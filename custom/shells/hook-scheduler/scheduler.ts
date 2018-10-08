import { Config } from 'core/config.gen';
import { EventList } from 'core/events.gen';
import { serverReady } from 'core/pending-tasks';
import scheduler, { Schedulers } from 'core/scheduler-loader';

export async function makeScheduler(force: boolean = false) {
    /// recycle previous schedulers
    let prevSchedulers = await new Parse.Query(Schedulers)
        .find();
    if (!force && prevSchedulers.length > 0) return;
    for (let prevScheduler of prevSchedulers) {
        prevScheduler.destroy();
    }

    /// hook schedulers by events
    let promises = [];
    let schedulers = [];
    let events = ["EventPreRegistrationComplete", "EventStrictCompleteCheckIn"];//, "EventInvitationComplete"];
    let controllers = ["PreRegistrationComplete", "VisitorCheckedIn"];//, "PreRegistration"];
    for (let key in events) {
        let event = events[key];
        let controller = controllers[key];
        /// make controllers
        let actions = [];
        Config.sms.enable && actions.push({ controller: `ScheduleController.SMS.${controller}` });
        Config.sgsms.enable && actions.push({ controller: `ScheduleController.SGSMS.${controller}` });
        Config.smtp.enable && actions.push({ controller: `ScheduleController.Email.${controller}` });

        let scheduler = new Schedulers({
            event: EventList[event],
            actions
        });
        schedulers.push( scheduler );
        promises.push( scheduler.save() );
    }

    await Promise.all(promises);

    scheduler.unregisterAll();
    scheduler.register(schedulers);
}

(async () => {
    await serverReady;

    await makeScheduler();

// /// Schedule - PreRegistrationComplete
// scheduler.register(new Schedulers({
//     event: EventList.EventPreRegistrationComplete,
//     actions: [
//         { controller: "ScheduleController.Email.PreRegistrationComplete" },
//         { controller: "ScheduleController.SMS.PreRegistrationComplete" }
//     ]
// }));

// /// Schedule - Visitor Checked-In
// scheduler.register(new Schedulers({
//     event: EventList.EventStrictCompleteCheckIn,
//     actions: [
//         { controller: "ScheduleController.Email.VisitorCheckedIn" },
//         { controller: "ScheduleController.SMS.VisitorCheckedIn" }
//     ]
// }));

// /// Schedule - Invitation Complete
// scheduler.register(new Schedulers({
//     event: EventList.EventInvitationComplete,
//     actions: [
//         { controller: "ScheduleController.Email.PreRegistration" },
//         { controller: "ScheduleController.SMS.PreRegistration" }
//     ]
// }));

})();

