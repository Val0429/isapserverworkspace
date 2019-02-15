import { app } from 'core/main.gen';
import { ParseObject, registerSubclass } from 'helpers/cgi-helpers/core';
import { serverReady } from 'core/pending-tasks';
import { reject } from 'bluebird';


import { Tree } from 'models/nodes/tree';
import { pickObject } from 'helpers/utility/pick-object';
import { Permission } from 'models/nodes/permission';
import { Log, Level } from 'helpers/utility';
import { Schedule, EScheduleUnitRepeatType, EScheduleUnitRepeatEndType, ISchedule, EScheduleUnitRepeatMonthType } from 'models/nodes/schedule';

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

@registerSubclass({memoryCache: true}) export class RegionPersonSchedule extends Schedule.Of(Person, Region) {}

/// make permission
interface IRegionPermission {
    all?: boolean;
    read?: boolean;
    write?: boolean;
    delete?: boolean;
}
@registerSubclass({memoryCache: true}) export class RegionPermission extends Permission.Of(Region).With<IRegionPermission>().On(Person, Group) {}

class test1 extends ParseObject<any> {}
class test2 extends test1 {}
console.log('instanceof?', test1 instanceof ParseObject);
console.log('instanceof?', test2 instanceof ParseObject);

//@registerSubclass({memoryCache: true}) export class RegionPermission extends Permission.Of(Region).With<IRegionPermission>().On(RegionPersonSchedule, Person, Group) {}

(async () => {

    await serverReady;

    let person = await new Parse.Query(Person).equalTo("name", "Min").first();
    let region = await new Parse.Query(Region).equalTo("name", "Taipei").first();
    let group = await new Parse.Query(Group).equalTo("name", "Super VIP").first();

    // console.log('group', group)
    // setTimeout( async () => {
    //     console.log('main...')
    //     Log.TraceTime("main", "time for create person");
    //     let person = await new Parse.Query(Person).equalTo("name", "Min").first();
    //     Log.TraceTimeEnd("main", "time for create person");
    // }, 3000)

    // // RegionPermission.set(region, group, {
    // //     read: true, write: false
    // // });

    // // RegionPermission.set(region, person, {
    // //     read: true,
    // //     write: false
    // // });

    // Log.TraceTime('Main', 'time for permission verify')
    // let result = await RegionPermission.verify(region, group, "all");
    // Log.TraceTimeEnd('Main', 'time for permission verify')
    // console.log('final result!', result);

    // // console.time('time for permission verify')
    // // result = await RegionPermission.verify(region, person, "read");
    // // console.timeEnd('time for permission verify')

})();

(async () => {

    try {
        let rroot = await Region.getRoot();
        if (!rroot) {
            rroot = await Region.setRoot({ name: "Taiwan", description: "" });
            rroot.addLeaf({name: "Keelong", description: ""});
            rroot.addLeaf({name: "Kaohsiung", description: ""});
            rroot.addLeaf({name: "Taoyuan", description: ""});
            
            let taipei = await rroot.addLeaf({name: "Taipei", description: ""});
            taipei.addLeaf({name: "Datong", description: ""});
            taipei.addLeaf({name: "Beitou", description: ""});

            let songshan = await taipei.addLeaf({name: "Sungshan", description: ""});
            songshan.addLeaf({name: "Mingshan", description: ""});
            songshan.addLeaf({name: "Nanjing", description: ""});
            songshan.addLeaf({name: "Songshan Train Station", description: ""});
        }

        let proot = await Person.getRoot();
        if (!proot) {
            proot = await Person.setRoot({ name: "Kelvin" });
            proot.addLeaf({ name: "Ken" });
            proot.addLeaf({ name: "Alex" });
            proot.addLeaf({ name: "Jasmine" });

            let frank = await proot.addLeaf({ name: "Frank" });
            frank.addLeaf({ name: "Tulip" });
            frank.addLeaf({ name: "Mark" });

            let val = await frank.addLeaf({ name: "Val" });
            val.addLeaf({ name: "Min" });
            val.addLeaf({ name: "Tom" });
        }

        let groot = await Group.getRoot();
        if (!groot) {
            groot = await Group.setRoot({ name: "VIP" });
            groot.addLeaf({ name: "Super VIP" });
            groot.addLeaf({ name: "Normal VIP" });
        }

        let PersonMin = await new Parse.Query(Person)
            .equalTo("name", "Min")
            .first();
        let RegionTaipei = await new Parse.Query(Region)
            .equalTo("name", "Taipei")
            .first();
        // /// 每周日一重複的整天事件
        // let rps = new RegionPersonSchedule({
        //     who: PersonMin,
        //     where: RegionTaipei,
        //     when: {
        //         beginDate: new Date(2019, 4, 12, 16, 0, 0),
        //         endDate: new Date(2019, 4, 12, 17, 0, 0),
        //         fullDay: false,
        //         repeat: {
        //             type: EScheduleUnitRepeatType.Year,
        //             value: 1,
        //             data: EScheduleUnitRepeatMonthType.ByWeekday,
        //             endType: EScheduleUnitRepeatEndType.NoStop
        //         }
        //     }
        // });
        // await rps.save();
        let cal = await RegionPersonSchedule.buildCalendar(PersonMin, { start: new Date(2018, 11, 29, 0,0,0,0), end: new Date(2030,1,5,0,0,0,0) });
        console.log('Cal!', cal.matchTime(new Date(2019,4,12,16,30,0)));

    } catch(e) { console.log('catched', JSON.stringify(e)) }

})();




// enum ECalendarUnitRepeatType {
//     NoRepeat = 0x0000,
//     Day = 0x1000,
//     WeekDay = 0x1500,
//     Week = 0x2000,
//     Month = 0x3000,
//     Year = 0x10000,
// }

// enum ECalendarUnitRepeatIntervalType {
//     NoRepeat = 0x0000,
//     Day = 0x1000,
//     Week = 0x2000,
//     Month = 0x3000,
//     Year = 0x10000,
// }

// enum ECalendarUnitRepeatEndType {
//     NoStop = 1,
//     Date = 2,
//     TotalTimes = 3
// }

// interface ICalendarUnitRepeatInterval {
//     /// 重複類別: 天週月年
//     type: ECalendarUnitRepeatIntervalType;
//     /// 重複間隔
//     value: number;
//     /// 重複資料
//     /// Day: never;
//     /// Week: number[];
//     /// Month: By this Day | By this Weekday
//     /// Year: never;
//     data: any;
// }

// interface ICalendarUnitRepeat {
//     type: ECalendarUnitRepeatType;

//     repeatInterval: ICalendarUnitRepeatInterval;

//     /// 結束時間類別
//     repeatEndType: ECalendarUnitRepeatEndType;
//     /// 結束時間 Date of Stop, or Number or Times
//     repeatEndValue: any;
// }

// interface ICalendarUnit {
//     beginDate: Date;
//     endDate: Date;
//     fullDay: boolean;

//     repeat: ICalendarUnitRepeat;
//     /// 計算出來的結束時間, by repeatEndDate & endDate
//     calculatedEndDate?: Date;
// }
