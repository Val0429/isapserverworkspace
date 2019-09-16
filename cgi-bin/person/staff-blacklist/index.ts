import { IUser, Action, Restful, RoleList, Errors, Socket, Config } from 'core/cgi-package';
import { default as Ast } from 'services/ast-services/ast-client';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, Utility, Db, FRS, Draw, File } from '../../../custom/helpers';
import * as Middleware from '../../../custom/middlewares';
import * as Enum from '../../../custom/enums';
import { default as DataCenter } from '../../../custom/services/data-center';

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
type InputC = IRequest.IPerson.IStaffBlacklistIndexC[];

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
                    try {
                        if (!('imageBase64' in value) && !('nric' in value)) {
                            throw Errors.throw(Errors.CustomBadRequest, ['imageBase64 or nric must be have one']);
                        }

                        if ('imageBase64' in value) {
                            let extension = File.GetBase64Extension(value.imageBase64);
                            if (!extension || extension.type !== 'image') {
                                throw Errors.throw(Errors.CustomBadRequest, ['media type error']);
                            }
                        }

                        if ('organization' in value && !value.organization) {
                            throw Errors.throw(Errors.CustomBadRequest, ['organization can not be empty']);
                        }

                        if (!value.name) {
                            throw Errors.throw(Errors.CustomBadRequest, ['name can not be empty']);
                        }

                        if ('nric' in value && !value.nric) {
                            throw Errors.throw(Errors.CustomBadRequest, ['nric can not be empty']);
                        }
                        if ('nric' in value) {
                            let _person: IDB.PersonStaffBlacklist = await new Parse.Query(IDB.PersonStaffBlacklist)
                                .equalTo('nric', value.nric)
                                .first()
                                .fail((e) => {
                                    throw e;
                                });
                            if (!!_person) {
                                throw Errors.throw(Errors.CustomBadRequest, ['duplicate person nric']);
                            }
                        }

                        let orignal: IDB.PersonStaffBlacklistOrignial = undefined;
                        let personId: string = undefined;
                        let buffer: Buffer = undefined;
                        if ('imageBase64' in value) {
                            buffer = Buffer.from(File.GetBase64Data(value.imageBase64), Enum.EEncoding.base64);

                            try {
                                let frsSetting = DataCenter.frsSetting$.value;
                                personId = await AddBlacklist(value.name, buffer, {
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

                            orignal = new IDB.PersonStaffBlacklistOrignial();

                            orignal.setValue('imageBase64', buffer.toString(Enum.EEncoding.base64));

                            await orignal.save(null, { useMasterKey: true }).fail((e) => {
                                throw e;
                            });

                            buffer = await Draw.Resize(buffer, imgSize, imgConfig.isFill, imgConfig.isTransparent);
                        }

                        let person: IDB.PersonStaffBlacklist = new IDB.PersonStaffBlacklist();

                        person.setValue('creator', data.user);
                        person.setValue('updater', data.user);
                        person.setValue('company', _userInfo.company);
                        person.setValue('imageBase64', 'imageBase64' in value ? buffer.toString(Enum.EEncoding.base64) : undefined);
                        person.setValue('imageOrignial', orignal);
                        person.setValue('organization', value.organization);
                        person.setValue('name', value.name);
                        person.setValue('nric', value.nric);
                        person.setValue('remark', value.remark);
                        person.setValue('personId', personId);

                        await person.save(null, { useMasterKey: true }).fail((e) => {
                            throw e;
                        });

                        resMessages[index].objectId = person.id;
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
 * Action Read
 */
type InputR = IRequest.IDataList;

type OutputR = IResponse.IDataList<IResponse.IPerson.IStaffBlacklistIndexR> | IResponse.IPerson.IStaffBlacklistIndexR;

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

            let query: Parse.Query<IDB.PersonStaffBlacklist> = new Parse.Query(IDB.PersonStaffBlacklist);

            if ('keyword' in _input) {
                let query1 = new Parse.Query(IDB.PersonStaffBlacklist).matches('name', new RegExp(_input.keyword), 'i');
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

            let persons: IDB.PersonStaffBlacklist[] = await query
                .skip((_paging.page - 1) * _paging.pageSize)
                .limit(_paging.pageSize)
                .include('company')
                .find()
                .fail((e) => {
                    throw e;
                });

            let results = persons.map<IResponse.IPerson.IStaffBlacklistIndexR>((value, index, array) => {
                let _image: string = !value.getValue('imageBase64') ? undefined : Utility.Base64Str2HtmlSrc(value.getValue('imageBase64'));

                let _company: IResponse.IObject = !value.getValue('company')
                    ? undefined
                    : {
                          objectId: value.getValue('company').id,
                          name: value.getValue('company').getValue('name'),
                      };

                return {
                    objectId: value.id,
                    imageBase64: _image,
                    company: _company,
                    organization: value.getValue('organization'),
                    name: value.getValue('name'),
                    nric: value.getValue('nric'),
                    remark: value.getValue('remark'),
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

// /**
//  * Action update
//  */
// type InputU = IRequest.IPerson.IStaffBlacklistIndexU[];

// type OutputU = IResponse.IMultiData;

// action.put(
//     {
//         inputType: 'MultiData',
//         middlewares: [Middleware.MultiDataFromBody],
//         permission: [RoleList.SystemAdministrator, RoleList.Administrator, RoleList.TenantAdministrator],
//     },
//     async (data): Promise<OutputU> => {
//         let _input: InputU = await Ast.requestValidation('InputU', data.parameters.datas);

//         try {
//             let _userInfo = await Db.GetUserInfo(data.request, data.user);
//             let resMessages: IResponse.IResponseMessage[] = data.parameters.resMessages;

//             await Promise.all(
//                 _input.map(async (value, index, array) => {
//                     try {
//                         let query: Parse.Query<IDB.PersonStaffBlacklist> = new Parse.Query(IDB.PersonStaffBlacklist).equalTo('objectId', value.objectId);

//                         if (!!_userInfo.company) {
//                             query.equalTo('company', _userInfo.company);
//                         }

//                         let person: IDB.PersonStaffBlacklist = await query.first().fail((e) => {
//                             throw e;
//                         });
//                         if (!person) {
//                             throw Errors.throw(Errors.CustomBadRequest, ['blacklist not found']);
//                         }

//                         person.setValue('updater', data.user);
//                         if (!!_userInfo.company) {
//                             person.setValue('company', _userInfo.company);
//                         } else {
//                             person.unset('company');
//                         }

//                         if ('organization' in value) {
//                             if (!value.organization) {
//                                 throw Errors.throw(Errors.CustomBadRequest, ['organization can not be empty']);
//                             }

//                             person.setValue('organization', value.organization);
//                         }
//                         if ('name' in value) {
//                             if (!value.name) {
//                                 throw Errors.throw(Errors.CustomBadRequest, ['name can not be empty']);
//                             }

//                             person.setValue('name', value.name);
//                         }
//                         if ('nric' in value) {
//                             if (!value.nric) {
//                                 throw Errors.throw(Errors.CustomBadRequest, ['nric can not be empty']);
//                             }

//                             person.setValue('nric', value.nric);
//                         }
//                         if ('remark' in value) {
//                             person.setValue('remark', value.remark);
//                         }

//                         await person.save(null, { useMasterKey: true }).fail((e) => {
//                             throw e;
//                         });
//                     } catch (e) {
//                         resMessages[index] = Utility.E2ResMessage(e, resMessages[index]);

//                         Print.Log(e, new Error(), 'error');
//                     }
//                 }),
//             );

//             return {
//                 datas: resMessages,
//             };
//         } catch (e) {
//             Print.Log(e, new Error(), 'error');
//             throw e;
//         }
//     },
// );

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
                        let query: Parse.Query<IDB.PersonStaffBlacklist> = new Parse.Query(IDB.PersonStaffBlacklist).equalTo('objectId', value);

                        if (!!_userInfo.company) {
                            query.equalTo('company', _userInfo.company);
                        }

                        let person: IDB.PersonStaffBlacklist = await query.first().fail((e) => {
                            throw e;
                        });
                        if (!person) {
                            throw Errors.throw(Errors.CustomBadRequest, ['blacklist not found']);
                        }

                        try {
                            let frsSetting = DataCenter.frsSetting$.value;
                            await RemoveBlacklist(person.getValue('personId'), {
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

                        let organization: IDB.PersonStaffBlacklistOrignial = person.getValue('imageOrignial');

                        if (!!organization) {
                            await organization.destroy({ useMasterKey: true }).fail((e) => {
                                throw e;
                            });
                        }
                        await person.destroy({ useMasterKey: true }).fail((e) => {
                            throw e;
                        });
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
 * Add Blacklist
 * @param name
 * @param buffer
 * @param config
 */
export async function AddBlacklist(name: string, buffer: Buffer, config: FRS.IConfig): Promise<string> {
    try {
        let frs: FRS = await Login(config);

        let groups = await frs.GetUserGroups();
        let blacklist = groups.find((n) => n.name.toLocaleLowerCase() === 'blacklist');
        if (!blacklist) {
            throw 'group blacklist not found';
        }

        let personId: string = await frs.AddPerson(name, new Date(2035, 0, 1, 0, 0, 0, 0), [blacklist], buffer);

        return personId;
    } catch (e) {
        throw e;
    }
}

/**
 * Remove Blacklist
 * @param personId
 * @param config
 */
export async function RemoveBlacklist(personId: string, config: FRS.IConfig): Promise<void> {
    try {
        let frs: FRS = await Login(config);

        try {
            await frs.RemovePerson(personId);
        } catch (e) {
            Print.Log(e, new Error(), 'error');
        }
    } catch (e) {
        throw e;
    }
}
