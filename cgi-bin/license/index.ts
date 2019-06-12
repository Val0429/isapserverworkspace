import { IUser, Action, Restful, RoleList, Errors, Socket, Config } from 'core/cgi-package';
import { default as Ast } from 'services/ast-services/ast-client';
import { IRequest, IResponse, IDB } from '../../custom/models';
import { Print, File } from '../../custom/helpers';
import * as Middleware from '../../custom/middlewares';
import * as Enum from '../../custom/enums';
import * as HttpClient from 'request';
import licenseService from 'services/license';

var action = new Action({
    loginRequired: true,
    permission: [RoleList.SuperAdministrator, RoleList.Admin],
});

export default action;

/**
 * Action Create
 */
type InputC = IRequest.ILicense.IIndexC_Key | IRequest.ILicense.IIndexC_Data;

type OutputC = Date;

action.post(
    {
        inputType: 'InputC',
    },
    async (data): Promise<OutputC> => {
        try {
            let _input: InputC = data.inputType;

            if ('key' in _input && 'mac' in _input) {
                let res1: number = await licenseService.verifyLicenseKey({ key: _input.key });
                if (res1 <= 0) {
                    throw Errors.throw(Errors.CustomBadRequest, ['License invalid.']);
                }

                let url = `http://www.isapsolution.com/register.aspx?L=${_input.key}&M=${_input.mac.replace(/:/g, '-')}`;
                let res2: string = await new Promise<string>((resolve, reject) => {
                    try {
                        HttpClient.post(
                            {
                                url: url,
                            },
                            (error, response, body) => {
                                if (error) {
                                    return reject(error);
                                } else if (response.statusCode !== 200) {
                                    return reject(
                                        `${response.statusCode}, ${body
                                            .toString()
                                            .replace(/\r\n/g, '; ')
                                            .replace(/\n/g, '; ')}`,
                                    );
                                } else if (/^ERROR/.test(body)) {
                                    return reject(Errors.throw(Errors.CustomBadRequest, [`License Invalid: ${body}`]));
                                }

                                resolve(body);
                            },
                        );
                    } catch (e) {
                        return reject(e);
                    }
                }).catch((e) => {
                    throw e;
                });

                await licenseService.addLicense({ xml: res2 });
            } else {
                let res3: boolean = (await licenseService.verifyLicenseXML({ xml: _input.data })) as boolean;
                if (res3 === false) {
                    throw Errors.throw(Errors.CustomBadRequest, ['License invalid.']);
                }

                await licenseService.addLicense({ xml: _input.data });
            }

            File.CopyFile('workspace/custom/license/license.xml', 'workspace/custom/assets/license/license.xml');

            return new Date();
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);

/**
 * Action Read
 */
type InputR = IRequest.IDataList;

type OutputR = IResponse.IDataList<IResponse.ILicense.IIndexR>;

action.get(
    {
        inputType: 'InputR',
        middlewares: [Middleware.PagingRequestDefaultValue],
    },
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;
            let _paging: IRequest.IPaging = _input.paging;

            let license = await licenseService.getLicense();

            let total: number = license.licenses.length;
            let totalPage: number = Math.ceil(total / _paging.pageSize);

            return {
                paging: {
                    total: total,
                    totalPages: totalPage,
                    page: _paging.page,
                    pageSize: _paging.pageSize,
                },
                results: license.licenses.map((value, index, array) => {
                    return {
                        licenseKey: value.licenseKey,
                        description: value.description,
                        mac: value.mac,
                        brand: value.brand,
                        productNO: value.productNO,
                        productName: ProdectId2ProductName(value.productNO),
                        count: value.count,
                        trial: value.trial,
                        registerDate: value.registerDate,
                        expireDate: value.expireDate,
                        expired: value.expired,
                    };
                }),
            };
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);

/**
 * Convert prodect id to product name
 * @param productId
 */
function ProdectId2ProductName(productId: string): string {
    try {
        let name: string = '';
        switch (productId) {
            case Config.deviceHumanDetection.productId:
                name = 'Human Detection';
                break;
            case Config.devicePeopleCounting.productId:
                name = 'People Counting';
                break;
            case Config.deviceDemographic.productId:
                name = 'Demographic';
                break;
            case Config.deviceDwellTime.productId:
                name = 'Dwell Time';
                break;
            case Config.deviceHeatmap.productId:
                name = 'Heatmap';
                break;
            case Config.deviceVisitor.productId:
                name = 'Visitor';
                break;
            default:
                throw 'Unrecognized product id';
        }

        return name;
    } catch (e) {
        throw e;
    }
}
