import { IUser, Action, Restful, RoleList, Errors, Socket, Config } from 'core/cgi-package';
import { default as Ast } from 'services/ast-services/ast-client';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, Utility, Db, Draw, File } from '../../../custom/helpers';
import * as Middleware from '../../../custom/middlewares';
import * as Enum from '../../../custom/enums';
import { default as DataCenter } from '../../../custom/services/data-center';
import * as Person from '../';

let action = new Action({
    loginRequired: true,
});

export default action;

const imgConfig = Config.person.image;
const imgSize = { width: imgConfig.width, height: imgConfig.height };

/**
 * Action Create
 */
type InputC = IRequest.IPerson.IVisitorBlacklistIndexC;

type OutputC = IResponse.IPerson.IVisitorBlacklistIndexC;

action.post(
    {
        inputType: 'InputC',
        permission: [RoleList.VMS],
        postSizeLimit: 100000000,
    },
    async (data): Promise<OutputC> => {
        try {
            let _input: InputC = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);

            if (!('imageBase64' in _input) && !('nric' in _input)) {
                throw Errors.throw(Errors.CustomBadRequest, ['imageBase64 or nric must be have one']);
            }

            if ('imageBase64' in _input) {
                let extension = File.GetBase64Extension(_input.imageBase64);
                if (!extension || extension.type !== 'image') {
                    throw Errors.throw(Errors.CustomBadRequest, ['media type error']);
                }
            }

            if ('organization' in _input && !_input.organization) {
                throw Errors.throw(Errors.CustomBadRequest, ['organization can not be empty']);
            }

            if (!_input.name) {
                throw Errors.throw(Errors.CustomBadRequest, ['name can not be empty']);
            }

            if ('nric' in _input && !_input.nric) {
                throw Errors.throw(Errors.CustomBadRequest, ['nric can not be empty']);
            }
            if ('nric' in _input) {
                let _person: IDB.PersonVisitorBlacklist = await new Parse.Query(IDB.PersonVisitorBlacklist)
                    .equalTo('nric', _input.nric)
                    .first()
                    .fail((e) => {
                        throw e;
                    });
                if (!!_person) {
                    throw Errors.throw(Errors.CustomBadRequest, ['duplicate person nric']);
                }
            }

            let orignal: IDB.PersonVisitorBlacklistOrignial = undefined;
            let personId: string = undefined;
            let buffer: Buffer = undefined;
            if ('imageBase64' in _input) {
                buffer = Buffer.from(File.GetBase64Data(_input.imageBase64), Enum.EEncoding.base64);

                try {
                    let frsSetting = DataCenter.frsSetting$.value;
                    personId = await Person.FRSService.AddBlacklist(_input.name, buffer, {
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

                orignal = new IDB.PersonVisitorBlacklistOrignial();

                orignal.setValue('imageBase64', buffer.toString(Enum.EEncoding.base64));

                await orignal.save(null, { useMasterKey: true }).fail((e) => {
                    throw e;
                });

                buffer = await Draw.Resize(buffer, imgSize, imgConfig.isFill, imgConfig.isTransparent);
            }

            let person: IDB.PersonVisitorBlacklist = new IDB.PersonVisitorBlacklist();

            person.setValue('company', _userInfo.company);
            person.setValue('imageBase64', 'imageBase64' in _input ? buffer.toString(Enum.EEncoding.base64) : undefined);
            person.setValue('imageOrignial', orignal);
            person.setValue('organization', _input.organization);
            person.setValue('name', _input.name);
            person.setValue('nric', _input.nric);
            person.setValue('remark', _input.remark);
            person.setValue('personId', personId);

            await person.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });

            return {
                objectId: person.id,
                personId: person.getValue('personId'),
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

type OutputR = IResponse.IDataList<IResponse.IPerson.IVisitorBlacklistIndexR> | IResponse.IPerson.IVisitorBlacklistIndexR;

action.get(
    {
        inputType: 'InputR',
        middlewares: [Middleware.PagingRequestDefaultValue],
        permission: [RoleList.Administrator],
    },
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);
            let _paging: IRequest.IPaging = _input.paging;

            let query: Parse.Query<IDB.PersonVisitorBlacklist> = new Parse.Query(IDB.PersonVisitorBlacklist);

            if ('keyword' in _input) {
                let query1 = new Parse.Query(IDB.PersonVisitorBlacklist).matches('name', new RegExp(_input.keyword), 'i');
                query = Parse.Query.or(query1);
            }

            if ('objectId' in _input) {
                query.equalTo('objectId', _input.objectId);
            }

            let total: number = await query.count().fail((e) => {
                throw e;
            });
            let totalPage: number = Math.ceil(total / _paging.pageSize);

            let persons: IDB.PersonVisitorBlacklist[] = await query
                .skip((_paging.page - 1) * _paging.pageSize)
                .limit(_paging.pageSize)
                .include('company')
                .find()
                .fail((e) => {
                    throw e;
                });

            let results = persons.map<IResponse.IPerson.IVisitorBlacklistIndexR>((value, index, array) => {
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

/**
 * Action Delete
 */
type InputD = IRequest.IPerson.IVisitorBlacklistIndexD;

type OutputD = Date;

action.delete(
    {
        inputType: 'InputD',
        permission: [RoleList.VMS],
    },
    async (data): Promise<OutputD> => {
        try {
            let _input: InputD = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);

            let person: IDB.PersonVisitorBlacklist = await new Parse.Query(IDB.PersonVisitorBlacklist)
                .equalTo('objectId', _input.objectId)
                .first()
                .fail((e) => {
                    throw e;
                });
            if (!person) {
                throw Errors.throw(Errors.CustomBadRequest, ['blacklist not found']);
            }

            try {
                let frsSetting = DataCenter.frsSetting$.value;
                await Person.FRSService.RemoveBlacklist(person.getValue('personId'), {
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

            let orignial: IDB.PersonVisitorBlacklistOrignial = person.getValue('imageOrignial');

            if (!!orignial) {
                await orignial.destroy({ useMasterKey: true }).fail((e) => {
                    throw e;
                });
            }
            await person.destroy({ useMasterKey: true }).fail((e) => {
                throw e;
            });

            return new Date();
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
