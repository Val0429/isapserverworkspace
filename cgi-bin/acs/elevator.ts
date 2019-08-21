import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors, Cameras, ICameras,
    Restful, FileHelper, ParseObject, ElevatorGroup
} from 'core/cgi-package';

import { Log } from 'workspace/custom/services/log';
import { IElevator, Elevator } from '../../custom/models'
import licenseService from 'services/license';

var action = new Action({
    loginRequired: true,
    // permission: [RoleList.Admin, RoleList.SuperAdministrator, RoleList.SystemAdministrator],
    apiToken: "door_elevator_CRUD"
});

/// CRUD start /////////////////////////////////
/********************************
 * C: create object
 ********************************/
type InputC = Restful.InputC<IElevator>;
type OutputC = Restful.OutputC<IElevator>;

action.post<InputC, OutputC>({ inputType: "InputC" }, async (data) => {
    // let count: number = await new Parse.Query(Elevator).count();
    let count: number = await new Promise((resolve, reject) => {
        new Parse.Query(Elevator).count().then(
            (count) => {
                resolve(count);
            },
            (error) => {
                resolve(-1);
            }
        );
    }) as number;

    if (count == -1)
        throw Errors.throw(Errors.CustomBadRequest, ["License invalid."]);

    let xml = await licenseService.getLicense();

    let model = xml.summary["00222"];

    if (!model)
        throw Errors.throw(Errors.CustomBadRequest, ["License invalid. model no mismatch"]);
    else {
        let amount = model["totalCount"];

        if (!amount)
            throw Errors.throw(Errors.CustomBadRequest, ["License invalid."]);
        else {
            console.log(count, amount);
            if ( count + 1 <= amount) {
                /// 1) Create Object
                var obj = new Elevator(data.inputType);
                await obj.save(null, { useMasterKey: true });

                Log.Info(`info`, `postElevator ${data.inputType.elevatorname}`, data.user, false);

                /// 2) Output
                return ParseObject.toOutputJSON(obj);
            }
            else 
                throw Errors.throw(Errors.CustomBadRequest, ["License reach maximum."]);
        }
    }
});

/********************************
 * R: get object
 ********************************/
type InputR = Restful.InputR<IElevator>;
type OutputR = Restful.OutputR<IElevator>;

action.get<InputR, OutputR>({ inputType: "InputR" }, async (data) => {
    /// 1) Make Query
    var query = new Parse.Query(Elevator)
                    .ascending("elevatorname")
                    .include("reader");
    let filter = data.parameters as any;

    let groupQuery = new Parse.Query(ElevatorGroup)
                        .include("elevators");

    

    if(filter.groupname){        
            let groups = await groupQuery.matches("groupname", new RegExp(filter.groupname), "i")
            .limit(Number.MAX_SAFE_INTEGER)
            .find();        

            let elevatorIds = getElevatorIds(groups);
            query.containedIn("objectId", elevatorIds);
    }    

    if(filter.name){
        query.matches("elevatorname", new RegExp(filter.name), "i");
    }
    /// 2) With Extra Filters
    query = Restful.Filter(query, data.inputType);
    /// 3) Output
    return Restful.Pagination(query, data.parameters);
});

/********************************
 * U: update object
 ********************************/
type InputU = Restful.InputU<IElevator>;
type OutputU = Restful.OutputU<IElevator>;

action.put<InputU, OutputU>({ inputType: "InputU" }, async (data) => {
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query(Elevator).get(objectId);
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [`Elevator <${objectId}> not exists.`]);
    /// 2) Modify
    await obj.save({ ...data.inputType, objectId: undefined });

    Log.Info(`info`, `putElevator ${obj.get("elevatorname")}`, data.user, false);

    /// 3) Output
    return ParseObject.toOutputJSON(obj);
});

/********************************
 * D: delete object
 ********************************/
type InputD = Restful.InputD<IElevator>;
type OutputD = Restful.OutputD<IElevator>;

action.delete<InputD, OutputD>({ inputType: "InputD" }, async (data) => {
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query(Elevator).get(objectId);
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [`Elevator <${objectId}> not exists.`]);
    /// 2) Delete
    Log.Info(`info`, `deleteElevator ${obj.get("elevatorname")}`, data.user, false);

    obj.destroy({ useMasterKey: true });
    /// 3) Output
    return ParseObject.toOutputJSON(obj);
});
/// CRUD end ///////////////////////////////////

export default action;
function getElevatorIds(groups: ElevatorGroup[]) {
    let elevators = [];
    for (let group of groups) {
        elevators.push(...group.get("elevators"));
    }
    let elevatorIds = elevators.map(x => ParseObject.toOutputJSON(x)).map(x => x.objectId);
    return elevatorIds;
}