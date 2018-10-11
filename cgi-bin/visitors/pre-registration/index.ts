import {
    express, Request, Response, Router,
    Parse, IRole, IUser, RoleList, UserType,
    Action, Errors, Events,
    getEnumKey, omitObject, IInputPaging, IOutputPaging, Restful, UserHelper, ParseObject,
    EventPreRegistrationComplete
} from 'core/cgi-package';


import { Visitors, IVisitors, VisitorStatus } from './../../../custom/models/visitors';
import { Invitations } from './../../../custom/models/invitations';
import { Companies } from './../../../custom/models/companies';

const filter = { status: (value) => getEnumKey(VisitorStatus, value), company: false }

var action = new Action({
    loginRequired: false,
    permission: [RoleList.Administrator],
    postSizeLimit: 1024*1024*10
});

/// CRUD start /////////////////////////////////
/********************************
 * R: get object
 ********************************/
type InputR = Restful.InputR<{}> & Restful.ValidObject;
type OutputR = Restful.OutputR<IVisitors>;

action.get<InputR, OutputR>({ inputType: "InputR" }, async (data) => {
    /// 1) Make Query
    var { objectId } = data.inputType;
    var query = new Parse.Query(Visitors)
        .equalTo("objectId", objectId)
        .equalTo("status", VisitorStatus.Pending);

    if (await query.count() === 0) {
        throw Errors.throw(Errors.CustomBadRequest, [`Visitor <${objectId}> already registered or not exists.`]);
    }

    /// 2) With Extra Filters
    query = Restful.Filter(query, data.inputType);
    /// 3) Output
    return Restful.Pagination(query, data.inputType, filter);
});

/********************************
 * U: update object
 ********************************/
type InputU = Restful.InputU<IVisitors>;
type OutputU = Restful.OutputU<IVisitors>;

action.put<InputU, OutputU>({ inputType: "InputU" }, async (data) => {
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query(Visitors)
        .get(objectId);
    if (!obj || obj.getValue("status") === VisitorStatus.Completed) throw Errors.throw(Errors.CustomNotExists, [`Visitors <${objectId}> already registered or not exists.`]);
    /// 2) Modify
    await obj.save({ ...data.inputType, status: VisitorStatus.Completed, objectId: undefined });

    /// V2.1) Save Event
    let invitation = await new Parse.Query(Invitations)
        .descending("createdAt")
        .equalTo("visitor", obj)
        .first();

    /// V2.2) Special case: if invitation not exists.
    if (invitation) {
        let owner = invitation.getValue("parent"); 
        let visitor = obj;
        let company = visitor.getValue("company");
        let event = new EventPreRegistrationComplete({
            owner,
            invitation,
            company,
            visitor
        });
        let visitorName = visitor.getValue("name");
        let purpose = invitation.getValue("purpose");
        Events.save(event, {owner, invitation, company, visitor, purpose, visitorName});
    }

    /// 3) Output
    return ParseObject.toOutputJSON(obj, filter);
});

/// CRUD end ///////////////////////////////////

export default action;
