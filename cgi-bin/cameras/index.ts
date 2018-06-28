import {
    express, Request, Response, Router,
    Parse, IRole, IUser, RoleList,
    Action, Errors,
    Restful,
} from './../../../core/cgi-package';

import { Cameras, ICameras } from './../../custom/models/cameras';
import { Floors, IFloors } from './../../custom/models/floors';


var action = new Action({
    loginRequired: true,
    permission: [RoleList.Administrator, RoleList.Kiosk]
});

const requiredParameters = ["floor", "name", "sourceid", "x", "y", "angle"];
const acceptParameters = requiredParameters;
Restful.CRUD<ICameras>(action, Cameras, requiredParameters);

Restful.C(action, Cameras, requiredParameters, null, async (data) => {
    return {
        ...data,
        floor: await new Parse.Query(Floors).get(data.floor as any)
    }
});

Restful.R(action, Cameras, null, async (data) => {
    await data.getValue("floor").fetch();
    return data;
});

Restful.U(action, Cameras, acceptParameters, null, async (data) => {
    return {
        ...data,
        floor: data.floor ? await new Parse.Query(Floors).get(data.floor as any) : undefined
    }
});

Restful.D(action, Cameras);

export default action;