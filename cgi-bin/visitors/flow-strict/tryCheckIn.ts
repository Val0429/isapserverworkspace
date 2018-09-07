import {
    express, Request, Response, Router,
    Parse, IRole, IUser, RoleList,
    Action, Errors, Person, ParseObject,
    Events, EventStrictTryCheckIn
} from 'core/cgi-package';

import { Pin } from 'services/pin-code/pin-code';
import { Invitations } from './../../../custom/models/invitations';

export interface Input {
    pin: Pin;
}

export type Output = Invitations;

export default new Action<Input, Output>({
    loginRequired: true,
    inputType: "Input",
    permission: [RoleList.Kiosk]
})
.post(async (data) => {
    /// 1) resolve pin
    let invitation = await new Parse.Query(Invitations)
        .equalTo("pins", "829238")
        .first();

    return ParseObject.toOutputJSON(invitation);


    // /// Insert or Retrive
    // var person: Person = await new Parse.Query(Person)
    //     .equalTo("username", data.parameters.username)
    //     .first();

    // /// Error if not exists
    // if (!person) throw Errors.throw(Errors.VisitorNotExists);

    // var comp = new EventStrictTryCheckIn({
    //     owner: data.user,
    //     relatedPerson: person,
    // });
    // await Events.save(comp);

    // return {
    //     personId: person.id
    // }
});
