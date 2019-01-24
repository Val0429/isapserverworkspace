import { app } from 'core/main.gen';
import { ParseObject, registerSubclass } from 'helpers/cgi-helpers/core';
import { serverReady } from 'core/pending-tasks';
import { reject } from 'bluebird';
import { Tree } from 'models/nodes/tree';
import { pickObject } from 'helpers/utility/pick-object';

// import './custom/schedulers/index';
// import './custom/shells/create-index';
// import './custom/shells/auto-index';

interface ICalendarUnit {}

interface ICalendar<Who, Where, What = string, How = string> {
    who: Who;
    when: ICalendarUnit;
    where: Where;
    what?: What;
    how: How;
}
export class Calendar<T extends ICalendar<any, any, any>> extends ParseObject<T> {}

/// make person
interface IPerson {
    name: string;
    intro?: string;
}
@registerSubclass({memoryCache: true}) export class Person extends Tree<IPerson> {}

/// make region
interface IRegion {
    name: string;
    description: string;
}
@registerSubclass({memoryCache: true}) export class Region extends Tree<IRegion> {}

/// make calendar relationship between region & person
type IRegionPersonCalendar = ICalendar<Person, Region>;
@registerSubclass({memoryCache: true}) export class RegionPersonCalendar extends Calendar<IRegionPersonCalendar> {}

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

    } catch(e) { console.log('catched', JSON.stringify(e)) }

})();
