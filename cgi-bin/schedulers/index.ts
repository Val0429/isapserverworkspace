import {
    express, Request, Response, Router,
    Parse, IRole, IUser, RoleList,
    Action, Errors,
    Restful, EventSubjects,
    InputRestfulR, OutputRestfulR,
    InputRestfulU, OutputRestfulU,
    InputRestfulC, OutputRestfulC,
    InputRestfulD, OutputRestfulD,
} from './../../../core/cgi-package';

import { IScheduleTimes, IScheduleActions, ISchedulers, Schedulers, ScheduleTimes, ScheduleActions } from './../../../models/schedulers/schedulers.base';

var action = new Action({
    loginRequired: true,
    permission: [RoleList.Administrator, RoleList.SystemAdministrator]
});

export interface InputBase {
    event: string;
    time?: IScheduleTimes;
    actions: IScheduleActions<any>[];
}

/// C: create ///////////////////////////////////////
export type InputPost = InputRestfulC<InputBase>;
export type OutputPost = OutputRestfulR<ISchedulers>;

action.post<InputPost, OutputPost>({
    requiredParameters: ["event", "actions", "actions.action", "actions.template", "actions.data"]
}, async (data) => {
    var { event, time: p_time, actions: p_actions } = data.parameters;

    /// check event exists
    if (!EventSubjects[event]) throw Errors.throw(Errors.CustomNotExists, [`Event <${event}> not exists.`]);

    /// check action valid
    if (!Array.isArray(p_actions)) throw Errors.throw(Errors.CustomInvalid, [`<actions> should be array type.`]);

    var time = createScheduleTimes(p_time);
    if (time) await time.save();

    var actions = createScheduleActions(p_actions);
    for (var i=0; i<actions.length; ++i) await actions[i].save();

    var ss = new Schedulers({
        event, actions, time
    });
    await ss.save();

    return ss;
});
/////////////////////////////////////////////////////

/// R: get //////////////////////////////////////////
export type InputGet = InputRestfulR<{
    event?: string;
}>;
export type OutputGet = OutputRestfulR<ISchedulers>;

action.get<InputGet, OutputGet>(async (data) => {
    var params = data.parameters;
    var query = new Parse.Query(Schedulers).include("actions").include("time");
    params.event && query.equalTo("event", params.event);

    return await Restful.SingleOrPagination( query, params, null );
});
/////////////////////////////////////////////////////

/// U: put //////////////////////////////////////////
export type InputPut = InputRestfulU<Partial<InputBase>>;
export type OutputPut = OutputRestfulU<ISchedulers>;
action.put<InputPut, OutputPut>({
    requiredParameters: ["objectId"],
}, async (data) => {
    var { event, time, actions } = data.parameters;

    var schedule = await new Parse.Query(Schedulers)
        .include("actions")
        .include("time")
        .get(data.parameters.objectId);

    if (event) schedule.setValue("event", event);
    if (time) {
        schedule.getValue("time").destroy();
        schedule.setValue("time", createScheduleTimes(time));
    }
    if (actions) {
        schedule.getValue("actions").forEach( (data) => data.destroy() );
        schedule.setValue("actions", createScheduleActions(actions));
    }
    await schedule.save();

    return schedule;
});
/////////////////////////////////////////////////////

/// D: delete ///////////////////////////////////////
export type InputDelete = InputRestfulD<{
    objectId?: string;
}>;
export type OutputDelete = OutputRestfulD<ISchedulers>;

action.delete<InputDelete, OutputDelete>({
    requiredParameters: ["objectId"]
}, async (data) => {
    var params = data.parameters;
    var o = await new Parse.Query(Schedulers)
        .include("actions")
        .include("time")
        .get(params.objectId);

    /// delete actions
    o.getValue("actions").forEach( (data) => data.destroy() );

    /// delete time
    o.getValue("time").destroy();

    await o.destroy();

    return o;
});
/////////////////////////////////////////////////////

export default action;

function createScheduleTimes(time: IScheduleTimes): ScheduleTimes {
    if (!time) return undefined;
    if (time.start===undefined || time.end===undefined || time.type===undefined || time.unitsOfType===undefined)
        throw Errors.throw(Errors.CustomInvalid, [`Time object should contain <start, end, type, unitsOfType>.`]);

    time.start = new Date(time.start);
    time.end = new Date(time.end);
    return new ScheduleTimes(time);
}

function createScheduleActions(actions: IScheduleActions<any>[]): ScheduleActions[] {
    var ary = [];
    for (var action of actions) {
        ary.push(
            new ScheduleActions(action)
        );
    }
    return ary;
}
