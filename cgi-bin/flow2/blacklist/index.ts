import {
    express, Request, Response, Router,
    IRole, IUser, RoleList, IUserKioskData,
    Action, Errors,
    getEnumKey, omitObject, IInputPaging, IOutputPaging, Restful, UserHelper, ParseObject, FileHelper,
} from 'core/cgi-package';

// import * as shortid from 'shortid';

// import {
//     Flow2Buildings, IFlow2Buildings
// } from 'workspace/custom/models';

import {
    Flow2Visitors,
    Flow2Blacklists, IFlow2Blacklists
} from 'workspace/custom/models';
import { FRSManagerService } from 'workspace/custom/services/frs-manager-service';

type Visitors = Flow2Visitors;
let Visitors = Flow2Visitors;

type Blacklists = Flow2Blacklists;
let Blacklists = Flow2Blacklists;
type IBlacklists = IFlow2Blacklists;

var action = new Action({
    loginRequired: true,
    permission: [RoleList.Administrator, RoleList.TenantAdministrator, RoleList.TenantUser]
});


/// CRUD start /////////////////////////////////
/********************************
 * C: create object
 ********************************/
interface IInputCBlackList {
    nickname: string;
    visitor: Flow2Visitors;
    remark: string;
}
type InputC = Restful.InputC<IInputCBlackList>;
type OutputC = Restful.OutputC<IInputCBlackList>;

action.post<InputC, OutputC>({ inputType: "InputC" }, async (data) => {
    const { visitor, remark } = data.inputType;

    /// fetch privacy data
    await visitor.getValue("privacy").fetch();
    let name = visitor.getValue("name");
    let image = FileHelper.toBase64FromBuffer(
        await FileHelper.downloadParseFile(visitor.getValue("image"))
    );
    let nric = visitor.getValue("idcard").idnumber;

    /// send to frsm
    let frsm = FRSManagerService.sharedInstance();
    let bp = await frsm.createBlacklistPerson({
        imageBase64: image,
        name,
        nric,
        remark
    });
    let frsmInnerId = bp.objectId;

    visitor.setValue("blacklisted", true);
    await visitor.save();

    /// 1) Create Object
    var obj = new Blacklists({
        ...data.inputType,
        name,
        image,
        nric,
        frsmInnerId
    });
    await obj.save(null, { useMasterKey: true });

    /// 2) Output
    return ParseObject.toOutputJSON(obj);
});

/********************************
 * R: get object
 ********************************/
type InputR = Restful.InputR<IBlacklists>;
type OutputR = Restful.OutputR<IBlacklists>;

action.get<InputR, OutputR>({ inputType: "InputR" }, async (data) => {
    /// V1) Make Query
    var query = new Parse.Query(Blacklists)
        .include("visitor");
    /// 2) With Extra Filters
    query = Restful.Filter(query, data.inputType);
    /// 3) Output
    return Restful.Pagination(query, data.parameters);
});

/********************************
 * D: delete object
 ********************************/
type InputD = Restful.InputD<Blacklists>;
type OutputD = Restful.OutputD<Blacklists>;

action.delete<InputD, OutputD>({ inputType: "InputD" }, async (data) => {
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query(Blacklists).get(objectId);
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [`Blacklists <${objectId}> not exists.`]);

    /// send to frsm
    const { visitor, frsmInnerId } = obj.attributes;
    let frsm = FRSManagerService.sharedInstance();
    await frsm.deleteBlacklistPerson(frsmInnerId);
    visitor.setValue("blacklisted", false);
    await visitor.save();

    /// 2) Delete
    obj.destroy({ useMasterKey: true });

    /// 3) Output
    return ParseObject.toOutputJSON(obj);
});
/// CRUD end ///////////////////////////////////

export default action;
