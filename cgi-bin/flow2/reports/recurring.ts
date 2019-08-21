import {
    express, Request, Response, Router,
    IRole, IUser, RoleList, EventSubjects, ParseObject,
    Action, Errors, O, EventFlow2StrictCompleteCheckIn, Flow2Visitors, Flow2Companies
} from 'core/cgi-package';

type EventStrictCompleteCheckIn = EventFlow2StrictCompleteCheckIn;
let EventStrictCompleteCheckIn = EventFlow2StrictCompleteCheckIn;

type Visitors = Flow2Visitors;
let Visitors = Flow2Visitors;

type Companies = Flow2Companies;
let Companies = Flow2Companies;

export interface Input {
    start: Date;
    end: Date;
}

export interface OutputData {
    visitor: Visitors;
    totalVisit: number;
    lastVisitDate: Date;
}

export interface Output {
    data: OutputData[];
}

var action = new Action<Input, Output>({
    loginRequired: false
});

action.get({inputType: "Input"}, async (data) => {
    /// query all
    let query = await new Parse.Query(EventStrictCompleteCheckIn)
        .greaterThanOrEqualTo("createdAt", data.inputType.start)
        .lessThan("createdAt", data.inputType.end)
        .select("visitor")
        .include("visitor")
        .include('visitor.company')
        .find();

    /// arrange
    let index: { [objectId: string]: {
        visitor: Visitors;
        totalVisit: number;
        lastVisitDate: Date;
    } } = {};
    for (let col of query) {
        let visitor = col.attributes.visitor;
        if (!visitor) continue;
        let objectId = visitor.id;
        if (!objectId) continue;
        let lastVisitDate = col.createdAt;

        if (!index[objectId]) {
            index[objectId] = {
                visitor: col.attributes.visitor,
                totalVisit: 1,
                lastVisitDate
            }
        } else {
            index[objectId].totalVisit = index[objectId].totalVisit+1;
            index[objectId].lastVisitDate = lastVisitDate;
        }
    }

    // sort out
    let result: OutputData[] = [];
    for (let key in index) {
        let value = index[key];
        result.push(value);
    }
    /// order by totalVisit
    result.sort( (a, b) => b.totalVisit - a.totalVisit );

    return ParseObject.toOutputJSON({
        data: result
    });

    // return "" as any;

});

export default action;
