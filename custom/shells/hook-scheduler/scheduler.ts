import { EventList } from 'core/events.gen';
import { serverReady } from 'core/pending-tasks';
import scheduler, { Schedulers } from 'core/scheduler-loader';


(async () => {
    await serverReady;


/// Schedule - PreRegistrationComplete
scheduler.register(new Schedulers({
    event: EventList.EventPreRegistrationComplete,
    actions: [
        { controller: "ScheduleController.Email.PreRegistrationComplete" },
        { controller: "ScheduleController.SMS.PreRegistrationComplete" }
    ]
}));

/// Schedule - Visitor Checked-In
scheduler.register(new Schedulers({
    event: EventList.EventStrictCompleteCheckIn,
    actions: [
        { controller: "ScheduleController.Email.VisitorCheckedIn" },
        { controller: "ScheduleController.SMS.VisitorCheckedIn" }
    ]
}));

// scheduler.register(new Schedulers({
//     event: EventList.EventLogin,
//     actions: [
//         { controller: "ScheduleController.Email.LoginExample" }
//     ]
// }));

})();

