import {
    express, Request, Response, Router,
    Parse, IRole, IUser, RoleList, IUserKioskData,
    Action, Errors,
    getEnumKey, omitObject, IInputPaging, IOutputPaging, Restful, UserHelper, ParseObject,
} from 'core/cgi-package';
import * as request from 'request';
import licenseService from 'services/license';
import { promisify } from 'bluebird';

var action = new Action({
    loginRequired: true,
    permission: [RoleList.SystemAdministrator, RoleList.Administrator]
});

/// CRUD start /////////////////////////////////
/********************************
 * C: add license
 ********************************/
interface InputC {
    keyOrData: string;
    mac?: string;
}

action.post<InputC>({ inputType: "InputC" }, async (data) => {
    let { keyOrData: key, mac } = data.inputType;
    if (key.length === 29) {
        if (!mac) throw Errors.throw(Errors.ParametersRequired, ["mac"]);
        /// 1) online license 29 digits
        /// 1.1) VerifyLicenseKey
        let res1: number = await licenseService.verifyLicenseKey({key});
        if (res1 <= 0) throw Errors.throw(Errors.CustomBadRequest, ["License invalid."]);
        /// 1.2) send online url
        let url = `http://www.isapsolution.com/register.aspx?L=${key}&M=${mac}`;
        let xml = await new Promise( (resolve, reject) => {
            request({
                url, method: 'POST'
            }, (err, res, body) => {
                if (err) throw err;
                if (/^ERROR/.test(body)) reject( Errors.throw(Errors.CustomBadRequest, [`License Invalid: ${body}`]) );
                resolve(body);
            });
        }) as any as string;
        await licenseService.addLicense({ xml });

    } else {
        /// 2) offline register
        /// 2.1) VerifyLicenseXML
        let res3: boolean = await licenseService.verifyLicenseXML({xml: key}) as boolean;
        if (res3 === false) throw Errors.throw(Errors.CustomBadRequest, ["License invalid."]);
        /// 2.2) AddLicense
        await licenseService.addLicense({ xml: key });
    }

    return "";
});

/********************************
 * R: get license
 ********************************/
action.get( async (data) => {
    let xml = await licenseService.getLicense();
    return ParseObject.toOutputJSON(xml);
});
/// CRUD end ///////////////////////////////////

export default action;
