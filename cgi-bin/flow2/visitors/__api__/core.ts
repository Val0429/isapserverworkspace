import {
    express, Request, Response, Router,
    IRole, IUser, RoleList, UserType,
    Action, Errors, Config,
    Events, Flow2Invitations, IFlow2Invitations,
    getEnumKey, omitObject, IInputPaging, IOutputPaging, Restful, UserHelper, ParseObject, ActionParam, Flow2Visitors, Flow2Companies, Flow2VisitorStatus, EventFlow2InvitationComplete, Flow2Purposes,
} from 'core/cgi-package';

let Visitors = Flow2Visitors;
type Visitors = Flow2Visitors;
type Companies = Flow2Companies;

type VisitorStatus = Flow2VisitorStatus;
let VisitorStatus = Flow2VisitorStatus;

export async function ruleCombineVisitors(company: Companies, visitors: Visitors[]): Promise<Visitors[]> {
    let resolvedVisitors: Visitors[] = [];

    /// 1) Fetch or Create Visitors
    main: for (let visitor of visitors) {
        let idcard = visitor.get("idcard");
        let email = visitor.get("email");
        let phone = visitor.get("phone");
        let name = visitor.get("name");

        /// 2) apply visitor rule
        let savedVisitors = await new Parse.Query(Visitors)
            .include("privacy")
            .equalTo("company", company)
            .find();
        if (idcard && idcard.idnumber && idcard.name) {
            /// 2.1) rule 1: id card + name
            for (let svisitor of savedVisitors) {
                let sidcard = svisitor.get("idcard");
                if (
                    sidcard && sidcard.idnumber && sidcard.name &&
                    idcard.idnumber == sidcard.idnumber && idcard.name == sidcard.name
                ) {
                    resolvedVisitors.push(svisitor);
                    continue main;
                }
            }

        } else if (email) {
            /// 2.2) rule 2: email
            for (let svisitor of savedVisitors) {
                let semail = svisitor.get("email");
                if (
                    semail && email == semail
                ) {
                    resolvedVisitors.push(svisitor);
                    continue main;
                }
            }

        } else if (phone) {
            /// 2.3) rule 3: phone
            for (let svisitor of savedVisitors) {
                let sphone = svisitor.get("phone");
                if (
                    sphone && phone == sphone
                ) {
                    resolvedVisitors.push(svisitor);
                    continue main;
                }
            }
        }
        /// 2.X) no matches, add new
        visitor.set("company", company);
        visitor.set("status", VisitorStatus.Pending);
        /// 2.XX) overwrite name & phone
        visitor.set("name", name);
        visitor.set("phone", phone);
        resolvedVisitors.push(visitor);
    }

    return resolvedVisitors;
}