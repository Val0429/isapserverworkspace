import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors, Restful, registerSubclass, ParseObject, EventLogout,
} from 'core/cgi-package';
import { Tree, IGetTreeNodeL, IGetTreeNodeR } from 'models/nodes';

interface IRegionx {
    pid: string;
    name: string;
    description: string;
}
@registerSubclass({memoryCache: true, container: true}) export class Regionx extends Tree<IRegionx> { groupBy: null }


var action = new Action({
    loginRequired: true,
    permission: [RoleList.Administrator]
});

/// CRUD start /////////////////////////////////
/********************************
 * C: create object
 ********************************/
interface IRegionxCQuery {
    parent?: Regionx;
}
type InputC = Restful.InputC<IRegionx & IRegionxCQuery>;
type OutputC = Restful.OutputC<IRegionx>;

action.post<InputC, OutputC>({ inputType: "InputC" }, async (data) => {
    let { parent } = data.inputType;
    delete data.inputType.parent;
    let groupByKey = new Regionx().groupBy;
    let groupBy = groupByKey ? data.inputType[groupByKey as any] : null;
    /// 1) Create Object
    let result;
    if (!parent) {
        result = await Regionx.getRoot(groupBy);
        if (result) throw Errors.throw(Errors.CustomBadRequest, [`Parameters required: <parent>, because ${groupBy ? `group <${groupBy}> ` : ''}already has a root.`]);
        result = await Regionx.setRoot(data.inputType, groupBy);
    } else {
        let leaf = await new Parse.Query(Regionx)
            .equalTo(groupByKey, groupBy)
            .get(parent.id);
        result = await leaf.addLeaf(data.inputType);
    }
    /// 2) Output
    return ParseObject.toOutputJSON(result);
});

/********************************
 * R: get object
 ********************************/
type ReduceRQuery<C extends Tree<I>, I> = C["groupBy"] extends null ? {} | IGetTreeNodeR : IGetTreeNodeL<I[C["groupBy"]]> | IGetTreeNodeR;
type IRegionxRQuery = ReduceRQuery<Regionx, IRegionx>;
type InputR = Restful.InputR<IRegionx> & IRegionxRQuery;
type OutputR = Restful.OutputR<IRegionx>;

action.get<InputR, OutputR>({ inputType: "InputR" }, async (data) => {
    let result = [];
    /// 1) Make Query
    let root: Regionx;
    do {
        let { objectId, groupBy } = data.inputType as any;
        if (objectId) {
            root = await new Parse.Query(Regionx).get(objectId);
            if (!root) throw Errors.throw(Errors.CustomNotExists, [`Regionx <${objectId}> not exists.`]);
        } else {
            root = await Regionx.getRoot(groupBy);
        }
        if (!root) break;
        result = await root.getChildren();
    } while(0);
    /// 2) Output
    return Restful.Pagination(result, data.parameters);
});

/********************************
 * U: update object
 ********************************/
type InputU = Restful.InputU<IRegionx>;
type OutputU = Restful.OutputU<IRegionx>;

action.put<InputU, OutputU>({ inputType: "InputU" }, async (data) => {
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query(Regionx).get(objectId);
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [`Regionx <${objectId}> not exists.`]);
    /// 2) Modify
    await obj.save({ ...data.inputType, objectId: undefined });
    /// 3) Output
    return ParseObject.toOutputJSON(obj);
});

/********************************
 * D: delete object
 ********************************/
type InputD = Restful.InputD<IRegionx>;
type OutputD = Restful.OutputD<IRegionx>;

action.delete<InputD, OutputD>({ inputType: "InputD" }, async (data) => {
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query(Regionx).get(objectId);
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [`Regionx <${objectId}> not exists.`]);
    /// 2) Delete
    obj.destroy({ useMasterKey: true });
    /// 3) Output
    return ParseObject.toOutputJSON(obj);
});
/// CRUD end ///////////////////////////////////

export default action;
