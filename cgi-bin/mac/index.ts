import {
    express, Request, Response, Router,
    Parse, IRole, IUser, RoleList, IUserKioskData,
    Action, Errors, O,
    getEnumKey, omitObject, IInputPaging, IOutputPaging, Restful, UserHelper, ParseObject,
} from 'core/cgi-package';

import licenseService from 'services/license';
import { kioskLicense } from './../../custom/shells/hook-scheduler/scheduler';
import * as os from 'os';

var action = new Action({
    loginRequired: true,
    permission: [RoleList.SystemAdministrator, RoleList.Administrator]
});

/// R: get users //////////////////////////
action.get( async (data) => {
    let interfaces = os.networkInterfaces();
    const invalidMac: string = "00:00:00:00:00:00";
    let macs = [];
    for (let ifkey in interfaces) {
        let ifinfos = interfaces[ifkey];
        for (let ifinfo of ifinfos) {
            ifinfo.mac !== invalidMac && (macs.push(ifinfo.mac));
        }
    }
    macs = macs.filter( (v, i) => macs.indexOf(v) === i );
    return ParseObject.toOutputJSON(macs);
});
///////////////////////////////////////////

export default action;


