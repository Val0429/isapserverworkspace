import { IUser, Action, Restful, RoleList, Errors, Socket, Config } from 'core/cgi-package';
import { default as Ast } from 'services/ast-services/ast-client';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, Utility, Db, FRS, Draw, File, Regex, Suntec, EntryPass, HikVision, DateTime } from '../../../custom/helpers';
import * as Middleware from '../../../custom/middlewares';
import * as Enum from '../../../custom/enums';
import { default as DataCenter } from '../../../custom/services/data-center';
import ACSCard from '../../../custom/services/acs-card';

let action = new Action({
    loginRequired: true,
});

export default action;

type MultiData = IRequest.IMultiData;

const imgConfig = Config.person.image;
const imgSize = { width: imgConfig.width, height: imgConfig.height };

/**
 * Action Create
 */
type InputC = IRequest.IPerson.IStaffIndexC[];

type OutputC = IResponse.IMultiData;

action.post(
    {
        inputType: 'MultiData',
        middlewares: [Middleware.MultiDataFromBody],
        permission: [RoleList.SystemAdministrator, RoleList.Administrator, RoleList.TenantAdministrator],
        postSizeLimit: 100000000,
    },
    async (data): Promise<OutputC> => {
        let _input: InputC = await Ast.requestValidation('InputC', data.parameters.datas);

        try {
            let _userInfo = await Db.GetUserInfo(data.request, data.user);
            let resMessages: IResponse.IResponseMessage[] = data.parameters.resMessages;

            await Promise.all(
                _input.map(async (value, index, array) => {
                    let person: IDB.PersonStaff = undefined;

                    try {
                        if (!('imageBase64' in value) && !('isUseSuntecReward' in value)) {
                            throw Errors.throw(Errors.CustomBadRequest, ['imageBase64 or isUseSuntecReward must be have one']);
                        }

                        if ('imageBase64' in value) {
                            let extension = File.GetBase64Extension(value.imageBase64);
                            if (!extension || extension.type !== 'image') {
                                throw Errors.throw(Errors.CustomBadRequest, ['media type error']);
                            }
                        }

                        if (!value.name) {
                            throw Errors.throw(Errors.CustomBadRequest, ['name can not be empty']);
                        }

                        if (!value.email) {
                            throw Errors.throw(Errors.CustomBadRequest, ['email can not be empty']);
                        }
                        if (!Regex.IsEmail(value.email)) {
                            throw Errors.throw(Errors.CustomBadRequest, ['email format error']);
                        }

                        if ('phone' in value && !(Regex.IsNum(value.phone) || Regex.IsInternationalPhone(value.phone))) {
                            throw Errors.throw(Errors.CustomBadRequest, ['phone format error']);
                        }

                        if ('nric' in value) {
                            let _person: IDB.PersonStaffBlacklist = await new Parse.Query(IDB.PersonStaffBlacklist)
                                .equalTo('nric', value.nric)
                                .first()
                                .fail((e) => {
                                    throw e;
                                });
                            if (!!_person) {
                                throw Errors.throw(Errors.CustomBadRequest, ['this face was in blacklist']);
                            }
                        }

                        let permissionCompany: IDB.LocationCompanies = undefined;
                        let permissionFloors: IDB.LocationFloors[] = undefined;
                        let permissionBuilding: IDB.LocationBuildings = undefined;
                        if (!!_userInfo.company) {
                            permissionCompany = _userInfo.company;
                            permissionFloors = _userInfo.floors;
                            permissionBuilding = _userInfo.building;
                        } else if ('permissionCompanyId' in value) {
                            permissionCompany = await new Parse.Query(IDB.LocationCompanies)
                                .equalTo('objectId', value.permissionCompanyId)
                                .include(['floor', 'floor.building'])
                                .first()
                                .fail((e) => {
                                    throw e;
                                });
                            if (!permissionCompany) {
                                throw Errors.throw(Errors.CustomBadRequest, ['permission company not found']);
                            }

                            permissionFloors = permissionCompany.getValue('floor').filter((value1, index1, array1) => {
                                return value.permissionFloorIds.indexOf(value1.id) > -1;
                            });

                            permissionBuilding = permissionCompany.getValue('floor').length > 0 ? permissionCompany.getValue('floor')[0].getValue('building') : undefined;
                        } else {
                            throw Errors.throw(Errors.CustomBadRequest, ['need permission company']);
                        }

                        let unitNumber: string = permissionCompany.getValue('unitNumber');

                        let card: number = await ACSCard.GetNextCard('staff');

                        let orignal: IDB.PersonStaffOrignial = undefined;
                        let buffer: Buffer = undefined;
                        if ('imageBase64' in value) {
                            buffer = Buffer.from(File.GetBase64Data(value.imageBase64), Enum.EEncoding.base64);

                            try {
                                let frsSetting = DataCenter.frsSetting$.value;
                                await VerifyBlacklist(buffer, {
                                    protocol: frsSetting.protocol,
                                    ip: frsSetting.ip,
                                    port: frsSetting.port,
                                    wsport: frsSetting.port,
                                    account: frsSetting.account,
                                    password: frsSetting.password,
                                });
                            } catch (e) {
                                throw Errors.throw(Errors.CustomBadRequest, [`frs: ${e}`]);
                            }

                            orignal = new IDB.PersonStaffOrignial();

                            orignal.setValue('imageBase64', buffer.toString(Enum.EEncoding.base64));

                            await orignal.save(null, { useMasterKey: true }).fail((e) => {
                                throw e;
                            });

                            buffer = await Draw.Resize(buffer, imgSize, imgConfig.isFill, imgConfig.isTransparent);
                        }

                        person = new IDB.PersonStaff();

                        person.setValue('creator', data.user);
                        person.setValue('updater', data.user);
                        person.setValue('company', permissionCompany);
                        person.setValue('card', card);
                        person.setValue('imageBase64', 'imageBase64' in value ? buffer.toString(Enum.EEncoding.base64) : undefined);
                        person.setValue('imageOrignial', orignal);
                        person.setValue('isUseSuntecReward', value.isUseSuntecReward);
                        person.setValue('permissionFloors', permissionFloors);
                        person.setValue('permissionCompany', permissionCompany);
                        person.setValue('unitNumber', unitNumber);
                        person.setValue('name', value.name);
                        person.setValue('email', value.email);
                        person.setValue('nric', value.nric);
                        person.setValue('position', value.position);
                        person.setValue('phone', value.phone);
                        person.setValue('remark', value.remark);
                        person.setValue('startDate', value.startDate);
                        person.setValue('endDate', value.endDate);

                        await person.save(null, { useMasterKey: true }).fail((e) => {
                            throw e;
                        });

                        try {
                            let suntecSetting = DataCenter.suntecAppSetting$.value;
                            await SuntecAppCreate(person, permissionBuilding, permissionCompany, {
                                host: suntecSetting.host,
                                token: suntecSetting.token,
                            });
                        } catch (e) {
                            throw Errors.throw(Errors.CustomBadRequest, [`suntec app: ${e}`]);
                        }

                        try {
                            let acsServerSetting = DataCenter.acsServerSetting$.value;
                            await EntryPassCreate(person, permissionBuilding, {
                                ip: acsServerSetting.ip,
                                port: acsServerSetting.port,
                                serviceId: acsServerSetting.serviceId,
                            });
                        } catch (e) {
                            throw Errors.throw(Errors.CustomBadRequest, [`acs server: ${e}`]);
                        }

                        try {
                            await HikVisionCreate(person, !!orignal ? Buffer.from(orignal.getValue('imageBase64'), Enum.EEncoding.base64) : undefined, permissionFloors);
                        } catch (e) {
                            throw Errors.throw(Errors.CustomBadRequest, [`hikvision: ${e}`]);
                        }

                        resMessages[index].objectId = person.id;
                    } catch (e) {
                        try {
                            await Delete(person);
                        } catch (e) {}

                        resMessages[index] = Utility.E2ResMessage(e, resMessages[index]);

                        Print.Log(e, new Error(), 'error');
                    }
                }),
            );

            return {
                datas: resMessages,
            };
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

type OutputR = IResponse.IDataList<IResponse.IPerson.IStaffIndexR> | IResponse.IPerson.IStaffIndexR;

action.get(
    {
        inputType: 'InputR',
        middlewares: [Middleware.PagingRequestDefaultValue],
        permission: [RoleList.SystemAdministrator, RoleList.Administrator, RoleList.TenantAdministrator],
    },
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);
            let _paging: IRequest.IPaging = _input.paging;

            let query: Parse.Query<IDB.PersonStaff> = new Parse.Query(IDB.PersonStaff);

            if ('keyword' in _input) {
                let query1 = new Parse.Query(IDB.PersonStaff).matches('name', new RegExp(_input.keyword), 'i');
                query = Parse.Query.or(query1);
            }

            if (!!_userInfo.company) {
                query.equalTo('company', _userInfo.company);
            }

            if ('objectId' in _input) {
                query.equalTo('objectId', _input.objectId);
            }

            let total: number = await query.count().fail((e) => {
                throw e;
            });
            let totalPage: number = Math.ceil(total / _paging.pageSize);

            let persons: IDB.PersonStaff[] = await query
                .skip((_paging.page - 1) * _paging.pageSize)
                .limit(_paging.pageSize)
                .include(['company', 'permissionFloors', 'permissionCompany'])
                .find()
                .fail((e) => {
                    throw e;
                });

            let results = persons.map<IResponse.IPerson.IStaffIndexR>((value, index, array) => {
                let _image: string = !value.getValue('imageBase64') ? undefined : Utility.Base64Str2HtmlSrc(value.getValue('imageBase64'));

                let _company: IResponse.IObject = !value.getValue('company')
                    ? undefined
                    : {
                          objectId: value.getValue('company').id,
                          name: value.getValue('company').getValue('name'),
                      };

                let _permissionFloors: IResponse.IObject[] = value
                    .getValue('permissionFloors')
                    .filter((value, index, array) => {
                        return !!value;
                    })
                    .map<IResponse.IObject>((value, index, array) => {
                        return {
                            objectId: value.id,
                            name: value.getValue('name'),
                        };
                    });

                let _permissionCompany: IResponse.IObject = !value.getValue('permissionCompany')
                    ? undefined
                    : {
                          objectId: value.getValue('permissionCompany').id,
                          name: value.getValue('permissionCompany').getValue('name'),
                      };

                return {
                    objectId: value.id,
                    card: value.getValue('card'),
                    imageBase64: _image,
                    company: _company,
                    isUseSuntecReward: value.getValue('isUseSuntecReward'),
                    permissionFloors: _permissionFloors,
                    permissionCompany: _permissionCompany,
                    unitNumber: value.getValue('unitNumber'),
                    name: value.getValue('name'),
                    email: value.getValue('email'),
                    nric: value.getValue('nric'),
                    position: value.getValue('position'),
                    phone: value.getValue('phone'),
                    remark: value.getValue('remark'),
                    startDate: value.getValue('startDate'),
                    endDate: value.getValue('endDate'),
                };
            });

            if ('objectId' in _input) {
                if (results.length === 0) {
                    throw Errors.throw(Errors.CustomBadRequest, ['person not found']);
                }

                return results[0];
            }

            return {
                paging: {
                    total: total,
                    totalPages: totalPage,
                    page: _paging.page,
                    pageSize: _paging.pageSize,
                },
                results: results,
            };
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);

/**
 * Action Delete
 */
type InputD = IRequest.IDelete;

type OutputD = IResponse.IMultiData;

action.delete(
    {
        inputType: 'InputD',
        middlewares: [Middleware.MultiDataFromQuery],
        permission: [RoleList.SystemAdministrator, RoleList.Administrator, RoleList.TenantAdministrator],
    },
    async (data): Promise<OutputD> => {
        try {
            let _input: InputD = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);
            let _objectIds: string[] = data.parameters.objectIds;
            let resMessages: IResponse.IResponseMessage[] = data.parameters.resMessages;

            await Promise.all(
                _objectIds.map(async (value, index, array) => {
                    try {
                        let query: Parse.Query<IDB.PersonStaff> = new Parse.Query(IDB.PersonStaff).equalTo('objectId', value);

                        if (!!_userInfo.company) {
                            query.equalTo('company', _userInfo.company);
                        }

                        let person: IDB.PersonStaff = await query.first().fail((e) => {
                            throw e;
                        });
                        if (!person) {
                            throw Errors.throw(Errors.CustomBadRequest, ['person not found']);
                        }

                        await Delete(person);
                    } catch (e) {
                        resMessages[index] = Utility.E2ResMessage(e, resMessages[index]);

                        Print.Log(e, new Error(), 'error');
                    }
                }),
            );

            return {
                datas: resMessages,
            };
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);

/**
 *
 * @param person
 */
export async function Delete(person: IDB.PersonStaff): Promise<IDB.PersonStaff> {
    try {
        let company: IDB.LocationCompanies = await new Parse.Query(IDB.LocationCompanies)
            .equalTo('objectId', person.getValue('permissionCompany').id)
            .include(['floor', 'floor.building'])
            .first()
            .fail((e) => {
                throw e;
            });
        if (!company) {
            throw Errors.throw(Errors.CustomBadRequest, ['permission company not found']);
        }

        let floors: IDB.LocationFloors[] = person.getValue('permissionFloors');

        let building: IDB.LocationBuildings = company.getValue('floor').length > 0 ? company.getValue('floor')[0].getValue('building') : undefined;

        try {
            let suntecSetting = DataCenter.suntecAppSetting$.value;
            await SuntecAppDelete(person, {
                host: suntecSetting.host,
                token: suntecSetting.token,
            });
        } catch (e) {}

        try {
            let acsServerSetting = DataCenter.acsServerSetting$.value;
            await EntryPassDelete(person, building, {
                ip: acsServerSetting.ip,
                port: acsServerSetting.port,
                serviceId: acsServerSetting.serviceId,
            });
        } catch (e) {}

        try {
            await HikVisionDelete(person, floors);
        } catch (e) {}

        let cards: IDB.ACSCard[] = await new Parse.Query(IDB.ACSCard)
            .equalTo('card', person.getValue('card'))
            .find()
            .fail((e) => {
                throw e;
            });

        let organization: IDB.PersonStaffOrignial = person.getValue('imageOrignial');

        await Promise.all(
            cards.map(async (value, index, array) => {
                await value.destroy({ useMasterKey: true }).fail((e) => {
                    throw e;
                });
            }),
        );

        if (!!organization) {
            await organization.destroy({ useMasterKey: true }).fail((e) => {
                throw e;
            });
        }
        await person.destroy({ useMasterKey: true }).fail((e) => {
            throw e;
        });

        return person;
    } catch (e) {
        throw e;
    }
}

/**
 * Login
 * @param config
 */
export async function Login(config: FRS.IConfig): Promise<FRS> {
    try {
        let frs: FRS = new FRS();
        frs.config = config;

        frs.Initialization();

        await frs.Login();

        return frs;
    } catch (e) {
        throw e;
    }
}

/**
 * Verify Blacklist
 * @param buffer
 * @param config
 */
export async function VerifyBlacklist(buffer: Buffer, config: FRS.IConfig): Promise<void> {
    try {
        let frs: FRS = await Login(config);

        let face = await frs.VerifyBlacklist(buffer, 0.9);
        if (!!face) {
            throw 'this face was in blacklist';
        }
    } catch (e) {
        throw e;
    }
}

/**
 * Suntec App Create
 * @param person
 * @param buildingName
 * @param companyName
 * @param config
 */
export async function SuntecAppCreate(person: IDB.PersonStaff, building: IDB.LocationBuildings, company: IDB.LocationCompanies, config: IDB.ISettingSuntecApp): Promise<void> {
    try {
        if (person.getValue('isUseSuntecReward')) {
            let buildingName: string = !building ? '' : building.getValue('name');
            let companyName: string = !company ? '' : company.getValue('name');

            let suntec = Suntec.Suntec.getInstance();
            suntec.setConnection({
                protocal: 'https',
                host: config.host,
                token: config.token,
            });

            await suntec.signup({
                AccessId: person.id,
                Email: person.getValue('email'),
                FirstName: person.getValue('name'),
                OfficeBuilding: buildingName,
                CompanyName: companyName,
            });
        }
    } catch (e) {
        throw e;
    }
}

/**
 * Suntec App Delete
 * @param person
 * @param config
 */
export async function SuntecAppDelete(person: IDB.PersonStaff, config: IDB.ISettingSuntecApp): Promise<void> {
    try {
        if (person.getValue('isUseSuntecReward')) {
            let suntec = Suntec.Suntec.getInstance();
            suntec.setConnection({
                protocal: 'https',
                host: config.host,
                token: config.token,
            });

            await suntec.revoke({
                AccessId: person.id,
            });
        }
    } catch (e) {
        throw e;
    }
}

/**
 * EntryPass Create
 * @param person
 * @param accessGroup
 * @param config
 */
export async function EntryPassCreate(person: IDB.PersonStaff, building: IDB.LocationBuildings, config: { ip: string; port: number; serviceId: string }): Promise<void> {
    try {
        let acsGroup: IDB.SettingACSGroup = await new Parse.Query(IDB.SettingACSGroup)
            .equalTo('building', building)
            .first()
            .fail((e) => {
                throw e;
            });
        if (!acsGroup) {
            throw 'acs group not found';
        }

        let worker = EntryPass.CreateInstance(config.ip, config.port, config.serviceId);
        if (worker) {
            let staffInfo: EntryPass.EntryPassStaffInfo = {
                name: person.getValue('name'),
                serialNumber: person.id,
            };

            let cardInfo: EntryPass.EntryPassCardInfo = {
                serialNumber: person.getValue('card').toString(),
                accessGroup: acsGroup.getValue('group'),
            };

            let ret: EntryPass.OperationReuslt = await worker.AddCard(staffInfo, cardInfo);
            if (!ret.result) {
                throw ret.errorMessage;
            }
        }
    } catch (e) {
        throw e;
    }
}

/**
 * EntryPass Delete
 * @param person
 * @param accessGroup
 * @param config
 */
export async function EntryPassDelete(person: IDB.PersonStaff, building: IDB.LocationBuildings, config: { ip: string; port: number; serviceId: string }): Promise<void> {
    try {
        let acsGroup: IDB.SettingACSGroup = await new Parse.Query(IDB.SettingACSGroup)
            .equalTo('building', building)
            .first()
            .fail((e) => {
                throw e;
            });
        if (!acsGroup) {
            throw 'acs group not found';
        }

        let worker = EntryPass.CreateInstance(config.ip, config.port, config.serviceId);
        if (worker) {
            let staffInfo: EntryPass.EntryPassStaffInfo = {
                name: name,
                serialNumber: person.id,
            };

            let cardInfo: EntryPass.EntryPassCardInfo = {
                serialNumber: person.getValue('card').toString(),
                accessGroup: acsGroup.getValue('group'),
            };

            let ret: EntryPass.OperationReuslt = await worker.DeleteCard(staffInfo, cardInfo);
            if (!ret.result) {
                throw ret.errorMessage;
            }
        }
    } catch (e) {
        throw e;
    }
}

/**
 * HikVision Login
 * @param config
 */
export async function HikVisionLogin(config: HikVision.I_DeviceInfo): Promise<HikVision.Hikvision> {
    try {
        let hikVision = new HikVision.Hikvision();

        let deviceInfo: HikVision.I_DeviceInfo = config;

        let result = hikVision.createInstance(deviceInfo);
        if (!!result.result) {
            return hikVision;
        } else {
            throw result.errorMessage;
        }
    } catch (e) {
        throw e;
    }
}

/**
 * Get HikVision Date
 * @param config
 */
export function GetHikVisionDate(date: Date): HikVision.I_ValidPeriodTime {
    try {
        date = new Date(date || new Date(2035, 0, 1, 0, 0, 0, 0));
        20;
        let hikVisionDate: HikVision.I_ValidPeriodTime = {
            year: DateTime.ToString(date, 'YYYY'),
            month: DateTime.ToString(date, 'MM'),
            day: DateTime.ToString(date, 'DD'),
            hour: DateTime.ToString(date, 'HH'),
            minute: DateTime.ToString(date, 'mm'),
            second: DateTime.ToString(date, 'ss'),
        };

        return hikVisionDate;
    } catch (e) {
        throw e;
    }
}

/**
 * HikVision Create
 * @param person
 * @param buffer
 * @param floors
 */
export async function HikVisionCreate(person: IDB.PersonStaff, buffer: Buffer, floors: IDB.LocationFloors[]): Promise<void> {
    try {
        let hikVisions: IDB.ClientHikVision[] = await new Parse.Query(IDB.ClientHikVision)
            .containedIn('floor', floors)
            .find()
            .fail((e) => {
                throw e;
            });

        await Promise.all(
            hikVisions.map(async (value, index, array) => {
                let hikVision: HikVision.Hikvision = await HikVisionLogin({
                    ipAddress: value.getValue('ip'),
                    port: value.getValue('port').toString(),
                    account: value.getValue('account'),
                    password: value.getValue('password'),
                });

                try {
                    let result = hikVision.createCardItem({
                        cardNo: person.getValue('card').toString(),
                        employeeNo: person.id,
                        name: person.getValue('name'),
                        beginTime: GetHikVisionDate(person.getValue('startDate')),
                        endTime: GetHikVisionDate(person.getValue('endDate')),
                    });
                    if (!result.result) {
                        throw result.errorMessage;
                    }

                    if (!!buffer) {
                        result = hikVision.enrollFace({
                            cardNo: person.getValue('card').toString(),
                            faceLen: buffer.length,
                            faceBuffer: buffer,
                        });
                        if (!result.result) {
                            throw result.errorMessage;
                        }
                    }
                } catch (e) {
                    throw e;
                } finally {
                    hikVision.disposeInstance();
                }
            }),
        );
    } catch (e) {
        throw e;
    }
}

/**
 * HikVision Delete
 * @param person
 * @param floors
 */
export async function HikVisionDelete(person: IDB.PersonStaff, floors: IDB.LocationFloors[]): Promise<void> {
    try {
        let hikVisions: IDB.ClientHikVision[] = await new Parse.Query(IDB.ClientHikVision)
            .containedIn('floor', floors)
            .find()
            .fail((e) => {
                throw e;
            });

        await Promise.all(
            hikVisions.map(async (value, index, array) => {
                let hikVision: HikVision.Hikvision = await HikVisionLogin({
                    ipAddress: value.getValue('ip'),
                    port: value.getValue('port').toString(),
                    account: value.getValue('account'),
                    password: value.getValue('password'),
                });

                try {
                    let result = hikVision.removeCardItem(person.getValue('card').toString());
                    if (!result.result) {
                        throw result.errorMessage;
                    }

                    result = hikVision.removeFace(person.getValue('card').toString());
                    if (!result.result) {
                        throw result.errorMessage;
                    }
                } catch (e) {
                    throw e;
                } finally {
                    hikVision.disposeInstance();
                }
            }),
        );
    } catch (e) {
        throw e;
    }
}
