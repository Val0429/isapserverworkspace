import {
    express, Request, Response, Router,
    Parse, IRole, IUser, RoleList, UserType,
    Action, Errors,
    getEnumKey, omitObject, IInputPaging, IOutputPaging, Restful, UserHelper, ParseObject,
} from 'core/cgi-package';

import PinCode from 'services/pin-code/pin-code';
import { Invitations, IInvitations } from './../../../custom/models/invitations';
import { Purposes } from './../../../custom/models/purposes';
import { Visitors, IVisitors, VisitorStatus } from './../../../custom/models/visitors';

const inviteFilter = { parent: false, visitor: { company: false, status: (status) => getEnumKey(VisitorStatus, status) } };

var action = new Action({
    loginRequired: true,
    permission: [RoleList.TenantUser]
});

/// CRUD start /////////////////////////////////
/********************************
 * C: create object
 ********************************/
interface ICInvitations extends IInvitations {
    pins: never;
    parent: never;
}
type InputC = Restful.InputC<ICInvitations>;
type OutputC = Restful.OutputC<ICInvitations>;

action.post<InputC, OutputC>({ inputType: "InputC" }, async (data) => {
    /// V0) Initiate
    let parent = data.user;
    let cancelled = false;

    /// 1) Create Object
    let obj = new Invitations(data.inputType);

    /// V1.1) Make Pins
    let pins = await PinCode.next(data.inputType.dates.length);

    /// V1.2) Fetch or Create Visitors
    const { phone, email } = data.inputType.visitor.attributes;
    let userattr = parent.attributes as UserType<RoleList.TenantUser>;
    let company = userattr.data.company;
    let visitor = await new Parse.Query(Visitors)
        .equalTo("company", company)
        .equalTo("phone", phone)
        .equalTo("email", email)
        .first();
    if (!visitor) {
        visitor = data.inputType.visitor;
        visitor.setValue("company", company);
        visitor.setValue("status", VisitorStatus.Pending);
    }

    /// V2.0) Save
    await obj.save({ pins, parent, cancelled, visitor }, { useMasterKey: true });

    /// 2) Output
    return ParseObject.toOutputJSON(obj, inviteFilter);
});

/********************************
 * R: get object
 ********************************/
type InputR = Restful.InputR<IInvitations>;
type OutputR = Restful.OutputR<IInvitations>;

action.get<InputR, OutputR>({ inputType: "InputR" }, async (data) => {
    /// 1) Make Query
    var query = new Parse.Query(Invitations)
        .include("visitor")
        .include("purpose")
        .equalTo("parent", data.user);

    /// 2) With Extra Filters
    query = Restful.Filter(query, data.inputType);
    /// 3) Output
    return Restful.Pagination(query, data.inputType, inviteFilter);
});

/********************************
 * U: update object
 ********************************/
interface IUInvitations {
    purpose?: Purposes;
    cancelled?: boolean;
}

type InputU = Restful.InputU<IUInvitations>;
type OutputU = Restful.OutputU<IInvitations>;

action.put<InputU, OutputU>({ inputType: "InputU" }, async (data) => {
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query(Invitations)
        .include("visitor")
        .include("purpose")
        .get(objectId);
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [`Invitation <${objectId}> not exists.`]);
    /// 2) Modify
    await obj.save({ ...data.inputType, objectId: undefined });
    /// 3) Output
    return ParseObject.toOutputJSON(obj, inviteFilter);
});

export default action;
