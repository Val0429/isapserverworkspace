import {
    express, Request, Response, Router,
    IRole, IUser, RoleList,
    Action, Errors,
    getEnumKey, omitObject, IInputPaging, IOutputPaging, Restful, UserHelper, ParseObject,
} from 'core/cgi-package';
import * as request from 'request';
import licenseService from 'services/license';
import { promisify } from 'bluebird';
var getMac = require('getmac').getMac;

var action = new Action({
    loginRequired: true,
    // permission: [RoleList.SystemAdministrator, RoleList.Admin],
    apiToken: "system_license_CRUD"
});

/// CRUD start /////////////////////////////////
/********************************
 * C: add license
 ********************************/
interface InputC {
    keyOrData: string;
}

action.post<InputC>({ inputType: "InputC" }, async (data) => {
    let { keyOrData: key } = data.inputType;
    if (key.length === 29) {
        let mac: string = await promisify(getMac)() as string;

        /// 1) online license 29 digits
        /// 1.1) VerifyLicenseKey
        let res1: number = await licenseService.verifyLicenseKey({key});
        if (res1 <= 0) throw Errors.throw(Errors.CustomBadRequest, ["License invalid."]);

        /// 1.2) send online url
        let url = `http://www.isapsolution.com/register.aspx?L=${key}&M=${mac}`;

        let res2: string = await new Promise( (resolve, reject) => {
            request({
                url,
                method: 'POST'
            }, (err, res, body) => {
                if (err) throw err;
                resolve(body);
            });
        }) as string;

        // <XML>
        //     <Configure>
        //         <Brand>0000</Brand>
        //         <ProductNO>00221</ProductNO>
        //     </Configure>
        //     <Capability>
        //         <RegisterDate>2019/07/04</RegisterDate>
        //         <NumberOfChannel>002</NumberOfChannel>
        //         <Trial>1</Trial>
        //         <ExpireDate>2019/08/03</ExpireDate>
        //         <LicenseSerialNO>00001</LicenseSerialNO>
        //     </Capability>
        //     <Sign>AF35F36DB84466A90FB0BFD86E8C09AFA715F927947B614FF4892589CCC9C9F1C950FBC38485BBAAC03DA58AAACE9C8BED466959B777B6B9198D551F3D87CA3A0D03D468D84BAF42FC3AD2D679429F1878B973FE</Sign>
        //     <MAC>C46E1F0492CC</MAC>
        //     <ComputerName></ComputerName>
        // </XML>


        /// 1.2.1) If there are 'ERROR' inside body, throw
        if (/^ERROR/.test(res2)) throw Errors.throw(Errors.CustomBadRequest, [`License Invalid: ${res2}`]);
        /// 1.3) AddLicense
        await licenseService.addLicense({ xml: res2 });
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
    return {
        results: xml.licenses,
        summary: xml.summary
    }
});
/// CRUD end ///////////////////////////////////

export default action;
