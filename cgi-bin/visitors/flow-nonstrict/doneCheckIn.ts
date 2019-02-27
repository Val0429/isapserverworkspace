import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors, Person,
    Events, EventDoneCheckIn
} from 'core/cgi-package';


export interface Input {
    personId: string;
    result: boolean;
}

export default new Action<Input>({
    loginRequired: true,
    inputType: "Input",
    permission: [RoleList.Kiosk]
})
.post(async (data) => {
    var { personId, result } = data.parameters;

    /// Get Person
    var person: Person = await new Parse.Query(Person)
        .get(personId);

    /// Error if not exists
    if (!person) throw Errors.throw(Errors.VisitorNotExists);

    var comp = new EventDoneCheckIn({
        owner: data.user,
        relatedPerson: person,

        result,
    });
    await Events.save(comp);

    return;
});
