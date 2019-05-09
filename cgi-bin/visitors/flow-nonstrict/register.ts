import {
    express, Request, Response, Router,
    IRole, IUser, RoleList, Config,
    Action, Errors, Person, ParseObject, FileHelper,
    Events, IInvitations, Invitations, Restful, Purposes, Visitors, Companies
} from 'core/cgi-package';
import { doInvitation } from '../invites';



var action = new Action({
    loginRequired: true,
    permission: [RoleList.Kiosk]
});

/// CRUD start /////////////////////////////////
/********************************
 * C: create object
 ********************************/
// parent: Parse.User;
// visitor: Visitors;
// dates: IInvitationDateAndPin[];
// purpose: Purposes;
// notify: IInvitationNotify;
// cancelled?: boolean;
// walkIn?: boolean;

interface IRegister {
    purpose: Purposes;
    tenant: Parse.User;
    name: string;
    phone: string;
}

type InputC = Restful.InputC<IRegister>;
type OutputC = Restful.OutputC<IInvitations>;

action.post<InputC, OutputC>({ inputType: "InputC" }, async (data) => {
    let { purpose, name, phone, tenant: user } = data.inputType;
    let company = user.attributes.data.company;
    user.attributes.data.company = await new Parse.Query(Companies).get(company.objectId);
    
    /// calculate dayStart / dayEnd
    let dayStart = new Date();
    dayStart.setHours(0);
    dayStart.setMinutes(0);
    dayStart.setSeconds(0);
    dayStart.setMilliseconds(0);
    let dayEnd = new Date(dayStart);
    dayEnd.setDate(dayStart.getDate()+1);

    let result = await doInvitation({
        user,
        inputType: {
            purpose,
            visitor: new Visitors({
                name, phone
            }),
            notify: {
                visitor: { email: false, phone: false }
            },
            dates: [{ start: dayStart, end: dayEnd }],
            walkIn: true,
        } as any,
    } as any);

    /// 2) Output
    return ParseObject.toOutputJSON(result);
});
/// CRUD end ///////////////////////////////////

export default action;
