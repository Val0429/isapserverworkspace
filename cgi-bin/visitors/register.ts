import {
    express, Request, Response, Router,
    Parse, IRole, IUser, RoleList,
    Action, Errors, Person,
    Events, EventTryRegister, EventList,
} from './../../../core/cgi-package';

export interface Input {
    sessionId: string;
    username: string;
}

export interface Output {
    personId: string;
}

export default new Action<Input, Output>({
    loginRequired: true,
    requiredParameters: ["username"],
    permission: [RoleList.Kiosk]
})
.post(async (data) => {
    /// Insert or Retrive
    var person: Person = new Person({
        username: data.parameters.username
    });
    var { object: person, status } = await person.fetchOrInsert();

    /// Error if exists
    if (status == "fetch") {
        /// Double check registration complete
        var events = await Events.fetchLast(EventList.RegistrationComplete, person);
        if (events) throw Errors.throw(Errors.VisitorAlreadyExists);
    }

    /// todo: Add to Role
    var comp = new EventTryRegister({
        owner: data.user,
        relatedPerson: person,
    });
    await Events.save(comp);

    return {
        personId: person.id
    }
});
