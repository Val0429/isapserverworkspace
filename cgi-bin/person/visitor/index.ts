import { IUser, Action, Restful, RoleList, Errors, Socket, Config } from 'core/cgi-package';
import { default as Ast } from 'services/ast-services/ast-client';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, Utility, Db, Draw, File, Regex } from '../../../custom/helpers';
import * as Middleware from '../../../custom/middlewares';
import * as Enum from '../../../custom/enums';
import { default as DataCenter } from '../../../custom/services/data-center';
import ACSCard from '../../../custom/services/acs-card';
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
type InputC = IRequest.IPerson.IVisitorIndexC;

type OutputC = IResponse.IPerson.IVisitorIndexC;

action.post<InputC, OutputC>(
    {
        inputType: 'InputC',
        permission: [RoleList.VMS],
        postSizeLimit: 100000000,
    },
    async (data): Promise<OutputC> => {
        try {
            let _input: InputC = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);

            let person: IDB.PersonVisitor = undefined;

            try {
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

                if (!_input.email) {
                    throw Errors.throw(Errors.CustomBadRequest, ['email can not be empty']);
                }
                if (!Regex.IsEmail(_input.email)) {
                    throw Errors.throw(Errors.CustomBadRequest, ['email format error']);
                }

                if ('phone' in _input && !(Regex.IsNum(_input.phone) || Regex.IsInternationalPhone(_input.phone))) {
                    throw Errors.throw(Errors.CustomBadRequest, ['phone format error']);
                }

                if ('nric' in _input) {
                    let _person: IDB.PersonVisitorBlacklist = await new Parse.Query(IDB.PersonVisitorBlacklist)
                        .equalTo('nric', _input.nric)
                        .first()
                        .fail((e) => {
                            throw e;
                        });
                    if (!!_person) {
                        throw Errors.throw(Errors.CustomBadRequest, ['this nric was in blacklist']);
                    }
                }

                let company: IDB.LocationCompanies = await new Parse.Query(IDB.LocationCompanies)
                    .equalTo('objectId', _input.companyId)
                    .include(['floor', 'floor.building'])
                    .first()
                    .fail((e) => {
                        throw e;
                    });
                if (!company) {
                    throw Errors.throw(Errors.CustomBadRequest, ['company not found']);
                }

                let floors: IDB.LocationFloors[] = company.getValue('floor').filter((value1, index1, array1) => {
                    return _input.floorIds.indexOf(value1.id) > -1;
                });

                let buildings: IDB.LocationBuildings[] = company.getValue('floor').map((value1, index1, array1) => {
                    return value1.getValue('building');
                });

                let doors: IDB.LocationDoor[] = await GetDoors(buildings, floors, company);

                let unitNumber: string = company.getValue('unitNumber');

                let orignal: IDB.PersonVisitorOrignial = undefined;
                let buffer: Buffer = undefined;
                if ('imageBase64' in _input) {
                    buffer = Buffer.from(File.GetBase64Data(_input.imageBase64), Enum.EEncoding.base64);

                    try {
                        let frsSetting = DataCenter.frsSetting$.value;
                        await Person.FRSService.VerifyBlacklist(buffer, {
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

                    orignal = new IDB.PersonVisitorOrignial();

                    orignal.setValue('imageBase64', buffer.toString(Enum.EEncoding.base64));

                    await orignal.save(null, { useMasterKey: true }).fail((e) => {
                        throw e;
                    });

                    buffer = await Draw.Resize(buffer, imgSize, imgConfig.isFill, imgConfig.isTransparent);
                }

                let card: number = await ACSCard.GetNextCard('visitor');

                person = new IDB.PersonVisitor();

                person.setValue('company', company);
                person.setValue('floors', floors);
                person.setValue('doors', doors);
                person.setValue('imageBase64', 'imageBase64' in _input ? buffer.toString(Enum.EEncoding.base64) : undefined);
                person.setValue('imageOrignial', orignal);
                person.setValue('card', card);
                person.setValue('unitNumber', unitNumber);
                person.setValue('organization', _input.organization);
                person.setValue('name', _input.name);
                person.setValue('email', _input.email);
                person.setValue('nric', _input.nric);
                person.setValue('phone', _input.phone);
                person.setValue('remark', _input.remark);
                person.setValue('startDate', _input.startDate);
                person.setValue('endDate', _input.endDate);

                await person.save(null, { useMasterKey: true }).fail((e) => {
                    throw e;
                });

                try {
                    let acsServerSetting = DataCenter.acsServerSetting$.value;
                    await Person.EntryPassService.Create(person, buildings[0], {
                        ip: acsServerSetting.ip,
                        port: acsServerSetting.port,
                        serviceId: acsServerSetting.serviceId,
                    });
                } catch (e) {
                    throw Errors.throw(Errors.CustomBadRequest, [`acs server: ${e}`]);
                }

                try {
                    await Person.HikVisionService.Create(person, !!orignal ? Buffer.from(orignal.getValue('imageBase64'), Enum.EEncoding.base64) : undefined, doors);
                } catch (e) {
                    throw Errors.throw(Errors.CustomBadRequest, [`hikvision: ${e}`]);
                }

                return {
                    objectId: person.id,
                    card: person.getValue('card'),
                };
            } catch (e) {
                if (!!person) {
                    await person.destroy({ useMasterKey: true }).fail((e) => {
                        throw e;
                    });
                }

                throw e;
            }
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

type OutputR = IResponse.IDataList<IResponse.IPerson.IVisitorIndexR> | IResponse.IPerson.IVisitorIndexR;

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

            let query: Parse.Query<IDB.PersonVisitor> = new Parse.Query(IDB.PersonVisitor);

            if ('keyword' in _input) {
                let query1 = new Parse.Query(IDB.PersonVisitor).matches('name', new RegExp(_input.keyword), 'i');
                query = Parse.Query.or(query1);
            }

            if ('objectId' in _input) {
                query.equalTo('objectId', _input.objectId);
            }

            let total: number = await query.count().fail((e) => {
                throw e;
            });
            let totalPage: number = Math.ceil(total / _paging.pageSize);

            let persons: IDB.PersonVisitor[] = await query
                .skip((_paging.page - 1) * _paging.pageSize)
                .limit(_paging.pageSize)
                .include(['company', 'floors', 'doors'])
                .find()
                .fail((e) => {
                    throw e;
                });

            let results = persons.map<IResponse.IPerson.IVisitorIndexR>((value, index, array) => {
                let _image: string = !value.getValue('imageBase64') ? undefined : Utility.Base64Str2HtmlSrc(value.getValue('imageBase64'));

                let _company: IResponse.IObject = !value.getValue('company')
                    ? undefined
                    : {
                          objectId: value.getValue('company').id,
                          name: value.getValue('company').getValue('name'),
                      };

                let _floors: IResponse.IObject[] = value
                    .getValue('floors')
                    .filter((value, index, array) => {
                        return !!value;
                    })
                    .map<IResponse.IObject>((value, index, array) => {
                        return {
                            objectId: value.id,
                            name: value.getValue('name'),
                        };
                    });

                let _doors: IResponse.IObject[] = (value.getValue('doors') || [])
                    .filter((value, index, array) => {
                        return !!value;
                    })
                    .map<IResponse.IObject>((value, index, array) => {
                        return {
                            objectId: value.id,
                            name: value.getValue('name'),
                        };
                    });

                return {
                    objectId: value.id,
                    card: value.getValue('card'),
                    imageBase64: _image,
                    company: _company,
                    floors: _floors,
                    doors: _doors,
                    unitNumber: value.getValue('unitNumber'),
                    organization: value.getValue('organization'),
                    name: value.getValue('name'),
                    email: value.getValue('email'),
                    nric: value.getValue('nric'),
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
type InputD = IRequest.IPerson.IVisitorIndexD;

type OutputD = Date;

action.delete<InputD, OutputD>(
    {
        inputType: 'InputD',
        permission: [RoleList.VMS],
    },
    async (data): Promise<OutputD> => {
        try {
            let _input: InputD = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);

            let person: IDB.PersonVisitor = await new Parse.Query(IDB.PersonVisitor)
                .equalTo('objectId', _input.objectId)
                .first()
                .fail((e) => {
                    throw e;
                });
            if (!person) {
                throw Errors.throw(Errors.CustomBadRequest, ['person not found']);
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

/**
 * Get floors
 * @param buildings
 * @param floors
 * @param company
 * @param doorIds
 */
async function GetDoors(buildings: IDB.LocationBuildings[], floors: IDB.LocationFloors[], company: IDB.LocationCompanies): Promise<IDB.LocationDoor[]> {
    try {
        let buildingFloors: IDB.LocationFloors[] = await new Parse.Query(IDB.LocationFloors)
            .containedIn('building', buildings)
            .find()
            .fail((e) => {
                throw e;
            });

        let tasks = [];
        let doors: IDB.LocationDoor[] = [];

        tasks.push(
            (async () => {
                doors.push(
                    ...(await new Parse.Query(IDB.LocationDoor)
                        .equalTo('range', Enum.EDoorRange.floor)
                        .containedIn('floor', floors)
                        .find()
                        .fail((e) => {
                            throw e;
                        })),
                );
            })(),
        );
        tasks.push(
            (async () => {
                doors.push(
                    ...(await new Parse.Query(IDB.LocationDoor)
                        .equalTo('range', Enum.EDoorRange.building)
                        .containedIn('floor', buildingFloors)
                        .find()
                        .fail((e) => {
                            throw e;
                        })),
                );
            })(),
        );

        await Promise.all(tasks).catch((e) => {
            throw e;
        });

        return doors;
    } catch (e) {
        throw e;
    }
}

/**
 * Delete when person was delete
 */
IDB.PersonVisitor.notice$
    .filter((x) => x.crud === 'd')
    .subscribe({
        next: async (x) => {
            try {
                let person: IDB.PersonVisitor = x.data as IDB.PersonVisitor;

                let company: IDB.LocationCompanies = await new Parse.Query(IDB.LocationCompanies)
                    .equalTo('objectId', person.getValue('company').id)
                    .include(['floor', 'floor.building'])
                    .first()
                    .fail((e) => {
                        throw e;
                    });
                if (!company) {
                    throw Errors.throw(Errors.CustomBadRequest, ['company not found']);
                }

                let floors: IDB.LocationFloors[] = person.getValue('floors');

                let buildings: IDB.LocationBuildings[] = (company.getValue('floor') || []).map((value, index, array) => {
                    return value.getValue('building');
                });

                let doors: IDB.LocationDoor[] = person.getValue('doors');
                await Promise.all(
                    doors.map(async (value, index, array) => {
                        await value.fetch();
                    }),
                );

                try {
                    let acsServerSetting = DataCenter.acsServerSetting$.value;
                    await Person.EntryPassService.Delete(person, buildings[0], {
                        ip: acsServerSetting.ip,
                        port: acsServerSetting.port,
                        serviceId: acsServerSetting.serviceId,
                    });
                } catch (e) {
                    Print.Log(e, new Error(), 'error');
                }

                try {
                    await Person.HikVisionService.Delete(person, doors);
                } catch (e) {
                    Print.Log(e, new Error(), 'error');
                }

                let cards: IDB.ACSCard[] = await new Parse.Query(IDB.ACSCard)
                    .equalTo('card', person.getValue('card'))
                    .find()
                    .fail((e) => {
                        throw e;
                    });

                let orignial: IDB.PersonVisitorOrignial = person.getValue('imageOrignial');

                await Promise.all(
                    cards.map(async (value, index, array) => {
                        await value.destroy({ useMasterKey: true }).fail((e) => {
                            throw e;
                        });
                    }),
                );

                if (!!orignial) {
                    await orignial.destroy({ useMasterKey: true }).fail((e) => {
                        throw e;
                    });
                }
            } catch (e) {
                Print.Log(e, new Error(), 'error');
            }
        },
    });
