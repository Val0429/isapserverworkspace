import {
    express, Request, Response, Router,
    Parse, IRole, IUser, RoleList,
    Action, Errors,
    getEnumKey, omitObject, IInputPaging, IOutputPaging, Restful, UserHelper, ParseObject,
} from 'core/cgi-package';


var action = new Action({
    loginRequired: true,
    permission: [RoleList.Administrator]
});

/// CRUD start /////////////////////////////////
/********************************
 * C: create object
 ********************************/
enum EventList {
    "eventibms",
    "eventfts"
}
interface EventIBMS {
    type: EventList.eventibms,
    mp4: string;
    data: {
        value: {
            time: Date;
        }
    }
}
interface EventFTS {
    type: EventList.eventfts,
    mp4: string;
    imgUrl: string;
}

type MyEvent = EventIBMS | EventFTS;

type InputC = Restful.InputC<MyEvent>;
type OutputC = Restful.OutputC<MyEvent, { parseObject: false }>;

action.post<InputC, OutputC>({ inputType: "InputC" }, async (data) => {
    switch (data.inputType.type) {
        case EventList.eventibms:
            break;
        case EventList.eventfts:
            break;
    }

    return data.inputType;
});
/// CRUD end ///////////////////////////////////

export default action;
