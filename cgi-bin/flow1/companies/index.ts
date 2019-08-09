import {
    express, Request, Response, Router,
    IRole, IUser, RoleList, IUserKioskData,
    Action, Errors,
    getEnumKey, omitObject, IInputPaging, IOutputPaging, Restful, UserHelper, ParseObject,
} from 'core/cgi-package';

import * as shortid from 'shortid';

import {
    Flow1Floors, IFlow1Floors,
    Flow1Companies, IFlow1Companies
} from 'workspace/custom/models';

type ICompanies = IFlow1Companies;
let Companies = Flow1Companies;
type Companies = Flow1Companies;

var action = new Action({
    loginRequired: true,
    permission: [RoleList.Administrator]
});

/// CRUD start /////////////////////////////////
/********************************
 * C: create object
 ********************************/
type InputC = Restful.InputC<ICompanies>;
type OutputC = Restful.OutputC<ICompanies>;

action.post<InputC, OutputC>({ inputType: "InputC" }, async (data) => {
    /// 1) Create Object
    var obj = new Companies(data.inputType);
    await obj.save(null, { useMasterKey: true });

    /// V1.1) When create company, create a default TU.
    await createDefaultTU(obj);

    /// 2) Output
    return ParseObject.toOutputJSON(obj);
});

/********************************
 * R: get object
 ********************************/
type InputR = Restful.InputR<ICompanies>;
type OutputR = Restful.OutputR<ICompanies>;

action.get<InputR, OutputR>({ inputType: "InputR" }, async (data) => {
    /// V1) Make Query
    var query = new Parse.Query(Companies)
        .include("floor");
    /// 2) With Extra Filters
    query = Restful.Filter(query, data.inputType);
    /// 3) Output
    return Restful.Pagination(query, data.parameters);
});

/********************************
 * U: update object
 ********************************/
type InputU = Restful.InputU<ICompanies>;
type OutputU = Restful.OutputU<ICompanies>;

action.put<InputU, OutputU>({ inputType: "InputU" }, async (data) => {
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query(Companies).get(objectId);
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [`Companies <${objectId}> not exists.`]);
    /// 2) Modify
    await obj.save({ ...data.inputType, objectId: undefined });
    /// 3) Output
    return ParseObject.toOutputJSON(obj);
});

/********************************
 * D: delete object
 ********************************/
type InputD = Restful.InputD<ICompanies>;
type OutputD = Restful.OutputD<ICompanies>;

action.delete<InputD, OutputD>({ inputType: "InputD" }, async (data) => {
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query(Companies).get(objectId);
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [`Companies <${objectId}> not exists.`]);

    /// V2.0) Delete default TU
    deleteDefaultTU(obj);

    /// V2) Delete
    obj.destroy({ useMasterKey: true });

    /// 3) Output
    return ParseObject.toOutputJSON(obj);
});
/// CRUD end ///////////////////////////////////

export default action;


async function createDefaultTU(company: Companies): Promise<Parse.User> {
    let roleName = RoleList.TenantUser;
    /// 1) Create. Signup User
    let user: Parse.User = new Parse.User();
    try {
        user = await user.signUp({
            username: shortid.generate(),
            password: "123456",
            data: {
                description: "",
                company,
                floor: [],
            }
        }, { useMasterKey: true });
    } catch(e) {
        throw Errors.throw(Errors.CustomBadRequest, [e]);
    }

    /// 2) Add to Role
    let role = await new Parse.Query(Parse.Role)
        .equalTo("name", roleName)
        .first();
    role.getUsers().add(user);
    await role.save(null, {useMasterKey: true});

    /// 3) Add Role to User
    user.set("roles", [role]);
    await user.save(null, { useMasterKey: true });

    return user;
}

async function deleteDefaultTU(company: Companies) {
    let roles = await new Parse.Query(Parse.Role).equalTo("name", RoleList.TenantUser).find();

    let users = await new Parse.Query(Parse.User)
        .containedIn("roles", roles)    
        .equalTo("data.company.objectId", company.id)
        .find({useMasterKey: true});
        
    await Parse.Object.destroyAll(users, {useMasterKey: true});
}