import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../custom/models';
import {} from '../../custom/helpers';
import * as Enum from '../../custom/enums';
import licenseService from 'services/license';
import { promisify } from 'bluebird';
import * as request from 'request';
var getMac = require('getmac').getMac;

var action = new Action({
    loginRequired: true,
    permission: [RoleList.SystemAdministrator, RoleList.Admin],
});

export default action;

/**
 * Action Create
 */
type InputC = IRequest.ILicense.IIndexC;

type OutputC = Date;

action.post(
    { inputType: 'InputC' },
    async (data): Promise<OutputC> => {
        let _input: InputC = data.inputType;

        let { keyOrData: key } = data.inputType;
        if (key.length === 29) {
            let mac: string = (await promisify(getMac)()) as string;
            /// 1) online license 29 digits
            /// 1.1) VerifyLicenseKey
            let res1: number = await licenseService.verifyLicenseKey({ key });
            if (res1 <= 0) throw Errors.throw(Errors.CustomBadRequest, ['License invalid.']);
            /// 1.2) send online url
            let url = `http://www.isapsolution.com/register.aspx?L=${key}&M=${mac}`;
            let res2: string = (await new Promise((resolve, reject) => {
                request(
                    {
                        url,
                        method: 'POST',
                    },
                    (err, res, body) => {
                        if (err) throw err;
                        resolve(body);
                    },
                );
            })) as string;
            /// 1.2.1) If there are 'ERROR' inside body, throw
            if (/^ERROR/.test(res2)) throw Errors.throw(Errors.CustomBadRequest, [`License Invalid: ${res2}`]);
            /// 1.3) AddLicense
            await licenseService.addLicense({ xml: res2 });
        } else {
            /// 2) offline register
            /// 2.1) VerifyLicenseXML
            let res3: boolean = (await licenseService.verifyLicenseXML({ xml: key })) as boolean;
            if (res3 === false) throw Errors.throw(Errors.CustomBadRequest, ['License invalid.']);
            /// 2.2) AddLicense
            await licenseService.addLicense({ xml: key });
        }

        return new Date();
    },
);

/**
 * Action Read
 */
type InputR = null;

type OutputR = IResponse.ILicense.IIndexR[];

action.get(
    async (data): Promise<OutputR> => {
        let license = await licenseService.getLicense();

        return license.licenses.map((value, index, array) => {
            return {
                licenseKey: value.licenseKey,
                description: value.description,
                mac: value.mac,
                brand: value.brand,
                productNO: value.productNO,
                count: value.count,
                trial: value.trial,
                registerDate: value.registerDate,
                expireDate: value.expireDate,
                expired: value.expired,
            };
        });
    },
);
