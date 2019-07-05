import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors, Cameras, ICameras,
    Restful, FileHelper, ParseObject
} from 'core/cgi-package';

import { Log } from 'helpers/utility';
import { IDoor, Door } from '../../custom/models'
import licenseService from 'services/license';


var action = new Action({
    loginRequired: true,
    permission: [RoleList.Admin, RoleList.SuperAdministrator, RoleList.SystemAdministrator],
    apiToken: "5-1_door_door_CRUD"
});

/// CRUD start /////////////////////////////////
/********************************
 * C: create object
 ********************************/
type InputC = Restful.InputC<IDoor>;
type OutputC = Restful.OutputC<IDoor>;

action.post<InputC, OutputC>({ inputType: "InputC" }, async (data) => {
    let count: number = await new Promise((resolve, reject) => {
        new Parse.Query(Door).count().then(
            (count) => {
                resolve(count);
            },
            (error) => {
                resolve(-1);
            }
        );
    }) as number;;

    if (count == -1)
        throw Errors.throw(Errors.CustomBadRequest, ["License invalid."]);

    let xml = await licenseService.getLicense();
    // {
    //     "results": [
    //         {
    //             "licenseKey": "MNZSN-MQBST-GLSFS-KSBHN-FMNLV",
    //             "description": "Realtek PCIe GBE Family Controller",
    //             "mac": "C46E1F0492CC",
    //             "brand": "0000",
    //             "productNO": "00221",
    //             "count": 2,
    //             "trial": true,
    //             "registerDate": "2019/07/04",
    //             "expireDate": "2019/08/03",
    //             "expired": false
    //         }
    //     ],
    //     "summary": {
    //         "00221": {
    //             "totalCount": 2
    //         }
    //     }
    // }

    let model = xml.summary["00221"];

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
                var obj = new Door(data.inputType);
                await obj.save(null, { useMasterKey: true });

                Log.Info(`${this.constructor.name}`, `postDoor ${data.inputType.doorid} ${data.inputType.doorname}`);

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
type InputR = Restful.InputR<IDoor>;
type OutputR = Restful.OutputR<IDoor>;

action.get<InputR, OutputR>({ inputType: "InputR" }, async (data) => {
    /// 1) Make Query
    var query = new Parse.Query(Door);
    let filter = data.parameters as any;
    if(filter.name){
        query.matches("doorname", new RegExp(filter.name), "i");
    }
    /// 2) With Extra Filters
    query = Restful.Filter(query, data.inputType);
    /// 3) Output
    return Restful.Pagination(query, data.parameters);
});

/********************************
 * U: update object
 ********************************/
type InputU = Restful.InputU<IDoor>;
type OutputU = Restful.OutputU<IDoor>;

action.put<InputU, OutputU>({ inputType: "InputU" }, async (data) => {
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query(Door).get(objectId);
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [`Door <${objectId}> not exists.`]);
    /// 2) Modify
    await obj.save({ ...data.inputType, objectId: undefined });

    Log.Info(`${this.constructor.name}`, `putDoor ${obj.get("doorid")} ${obj.get("doorname")}`);

    /// 3) Output
    return ParseObject.toOutputJSON(obj);
});

/********************************
 * D: delete object
 ********************************/
type InputD = Restful.InputD<IDoor>;
type OutputD = Restful.OutputD<IDoor>;

action.delete<InputD, OutputD>({ inputType: "InputD" }, async (data) => {
    /// 1) Get Object
    var { objectId } = data.inputType;
    var obj = await new Parse.Query(Door).get(objectId);
    if (!obj) throw Errors.throw(Errors.CustomNotExists, [`Door <${objectId}> not exists.`]);
    /// 2) Delete

    Log.Info(`${this.constructor.name}`, `deleteDoor ${obj.get("doorid")} ${obj.get("doorname")}`);

    obj.destroy({ useMasterKey: true });
    /// 3) Output
    return ParseObject.toOutputJSON(obj);
});
/// CRUD end ///////////////////////////////////

export default action;
