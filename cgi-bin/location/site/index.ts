import { IUser, Action, Restful, RoleList, Errors, Socket, Config } from 'core/cgi-package';
import { default as Ast } from 'services/ast-services/ast-client';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, File, Parser, Db, Draw } from '../../../custom/helpers';
import * as Middleware from '../../../custom/middlewares';
import * as Enum from '../../../custom/enums';

let action = new Action({
    loginRequired: true,
    permission: [RoleList.SuperAdministrator, RoleList.Admin],
});

export default action;

type MultiData = IRequest.IMultiData;

/**
 * Action Create
 */
type InputC = IRequest.ILocation.ISiteIndexC[];

type OutputC = IResponse.IMultiData[];

action.post(
    {
        inputType: 'MultiData',
        postSizeLimit: 10000000,
        middlewares: [Middleware.MultiDataFromBody],
    },
    async (data): Promise<OutputC> => {
        let _input: InputC = await Ast.requestValidation('InputC', data.parameters.datas);

        try {
            let _userInfo = await Db.GetUserInfo(data.request, data.user);
            let resMessages: OutputC = data.parameters.resMessages;

            let imgConfig = Config.location.image;
            let imgSize = { width: imgConfig.width, height: imgConfig.height };

            await Promise.all(
                _input.map(async (value, index, array) => {
                    try {
                        let extension = File.GetBase64Extension(value.imageBase64);
                        if (!extension || extension.type !== 'image') {
                            throw Errors.throw(Errors.CustomBadRequest, ['media type error']);
                        }

                        if (value.customId === '') {
                            throw Errors.throw(Errors.CustomBadRequest, ['custom id can not be empty']);
                        }

                        let site: IDB.LocationSite = await new Parse.Query(IDB.LocationSite)
                            .equalTo('customId', value.customId)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (site) {
                            throw Errors.throw(Errors.CustomBadRequest, ['duplicate custom id']);
                        }

                        let manager: Parse.User = await new Parse.Query(Parse.User)
                            .equalTo('objectId', value.managerId)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (!manager) {
                            throw Errors.throw(Errors.CustomBadRequest, ['manager not found']);
                        }

                        value.imageBase64 = (await Draw.Resize(Buffer.from(File.GetBase64Data(value.imageBase64), Parser.Encoding.base64), imgSize, imgConfig.isFill, imgConfig.isTransparent)).toString(Parser.Encoding.base64);

                        let officeHours: IDB.IDayRange[] = (value.officeHours || []).map((value, index, array) => {
                            return {
                                startDay: value.startDay,
                                endDay: value.endDay,
                                startDate: new Date(new Date(value.startDate).setFullYear(2000, 0, 1)),
                                endDate: new Date(new Date(value.endDate).setFullYear(2000, 0, 1)),
                            };
                        });

                        site = new IDB.LocationSite();

                        site.setValue('name', value.name);
                        site.setValue('customId', value.customId);
                        site.setValue('manager', manager);
                        site.setValue('address', value.address);
                        site.setValue('phone', value.phone);
                        site.setValue('establishment', value.establishment);
                        site.setValue('squareMeter', value.squareMeter);
                        site.setValue('staffNumber', value.staffNumber);
                        site.setValue('officeHours', officeHours);
                        site.setValue('imageSrc', '');
                        site.setValue('longitude', value.longitude);
                        site.setValue('latitude', value.latitude);

                        await site.save(null, { useMasterKey: true }).fail((e) => {
                            throw e;
                        });

                        resMessages[index].objectId = site.id;

                        let imageSrc: string = `${extension.type}s/${site.id}_location_site_${site.createdAt.getTime()}.${extension.extension}`;
                        File.WriteBase64File(`${File.assetsPath}/${imageSrc}`, value.imageBase64);

                        site.setValue('imageSrc', imageSrc);

                        await site.save(null, { useMasterKey: true }).fail((e) => {
                            throw e;
                        });
                    } catch (e) {
                        resMessages[index] = Parser.E2ResMessage(e, resMessages[index]);

                        Print.Log(e, new Error(), 'error');
                    }
                }),
            );

            return resMessages;
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

type OutputR = IResponse.IDataList<IResponse.ILocation.ISiteIndexR>;

action.get(
    {
        inputType: 'InputR',
        middlewares: [Middleware.PagingRequestDefaultValue],
    },
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);
            let _paging: IRequest.IPaging = _input.paging;

            let query: Parse.Query<IDB.LocationSite> = new Parse.Query(IDB.LocationSite);

            let total: number = await query.count().fail((e) => {
                throw e;
            });
            let totalPage: number = Math.ceil(total / _paging.pageSize);

            let sites: IDB.LocationSite[] = await query
                .skip((_paging.page - 1) * _paging.pageSize)
                .limit(_paging.pageSize)
                .include('region')
                .find()
                .fail((e) => {
                    throw e;
                });

            let managers: Parse.User[] = sites.map((value, index, array) => {
                return value.getValue('manager');
            });
            let managerInfos: IDB.UserInfo[] = await new Parse.Query(IDB.UserInfo)
                .containedIn('user', managers)
                .find()
                .fail((e) => {
                    throw e;
                });

            return {
                paging: {
                    total: total,
                    totalPages: totalPage,
                    page: _paging.page,
                    pageSize: _paging.pageSize,
                },
                results: sites.map((value, index, array) => {
                    let region: IResponse.IObject = value.getValue('region')
                        ? {
                              objectId: value.getValue('region').id,
                              name: value.getValue('region').getValue('name'),
                          }
                        : undefined;

                    let managerInfo: IDB.UserInfo = managerInfos.find((value1, index1, array1) => {
                        return value1.getValue('user').id === value.getValue('manager').id;
                    });
                    let manager: IResponse.IObject = managerInfo
                        ? {
                              objectId: value.getValue('manager').id,
                              name: managerInfo.getValue('name'),
                          }
                        : undefined;

                    return {
                        objectId: value.id,
                        region: region,
                        name: value.getValue('name'),
                        customId: value.getValue('customId'),
                        manager: manager,
                        address: value.getValue('address'),
                        phone: value.getValue('phone'),
                        establishment: value.getValue('establishment'),
                        squareMeter: value.getValue('squareMeter'),
                        staffNumber: value.getValue('staffNumber'),
                        officeHours: value.getValue('officeHours'),
                        imageSrc: value.getValue('imageSrc'),
                        longitude: value.getValue('longitude'),
                        latitude: value.getValue('latitude'),
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
 * Action update
 */
type InputU = IRequest.ILocation.ISiteIndexU[];

type OutputU = IResponse.IMultiData[];

action.put(
    {
        inputType: 'MultiData',
        postSizeLimit: 10000000,
        middlewares: [Middleware.MultiDataFromBody],
    },
    async (data): Promise<OutputU> => {
        let _input: InputU = await Ast.requestValidation('InputU', data.parameters.datas);

        try {
            let _userInfo = await Db.GetUserInfo(data.request, data.user);
            let resMessages: OutputU = data.parameters.resMessages;

            let imgConfig = Config.location.image;
            let imgSize = { width: imgConfig.width, height: imgConfig.height };

            await Promise.all(
                _input.map(async (value, index, array) => {
                    try {
                        let site: IDB.LocationSite = await new Parse.Query(IDB.LocationSite)
                            .equalTo('objectId', value.objectId)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (!site) {
                            throw Errors.throw(Errors.CustomBadRequest, ['site not found']);
                        }

                        let extension = value.imageBase64 ? File.GetBase64Extension(value.imageBase64) : { extension: 'aa', type: 'image' };
                        if (!extension || extension.type !== 'image') {
                            throw Errors.throw(Errors.CustomBadRequest, ['media type error']);
                        }

                        let manager: Parse.User = undefined;
                        if (value.managerId) {
                            manager = await new Parse.Query(Parse.User)
                                .equalTo('objectId', value.managerId)
                                .first()
                                .fail((e) => {
                                    throw e;
                                });
                            if (!manager) {
                                throw Errors.throw(Errors.CustomBadRequest, ['manager not found']);
                            }
                        }

                        if (value.name || value.name === '') {
                            site.setValue('name', value.name);
                        }
                        if (value.managerId) {
                            site.setValue('manager', manager);
                        }
                        if (value.address || value.address === '') {
                            site.setValue('address', value.address);
                        }
                        if (value.phone || value.phone === '') {
                            site.setValue('phone', value.phone);
                        }
                        if (value.establishment) {
                            site.setValue('establishment', value.establishment);
                        }
                        if (value.squareMeter || value.squareMeter === 0) {
                            site.setValue('squareMeter', value.squareMeter);
                        }
                        if (value.staffNumber || value.staffNumber === 0) {
                            site.setValue('staffNumber', value.staffNumber);
                        }
                        if (value.officeHours) {
                            let officeHours: IDB.IDayRange[] = (value.officeHours || []).map((value, index, array) => {
                                return {
                                    startDay: value.startDay,
                                    endDay: value.endDay,
                                    startDate: new Date(new Date(value.startDate).setFullYear(2000, 0, 1)),
                                    endDate: new Date(new Date(value.endDate).setFullYear(2000, 0, 1)),
                                };
                            });

                            site.setValue('officeHours', officeHours);
                        }
                        if (value.imageBase64) {
                            value.imageBase64 = (await Draw.Resize(Buffer.from(File.GetBase64Data(value.imageBase64), Parser.Encoding.base64), imgSize, imgConfig.isFill, imgConfig.isTransparent)).toString(Parser.Encoding.base64);
                            let imageSrc: string = site.getValue('imageSrc');
                            File.WriteBase64File(`${File.assetsPath}/${imageSrc}`, value.imageBase64);
                        }
                        if (value.longitude || value.longitude === 0) {
                            site.setValue('longitude', value.longitude);
                        }
                        if (value.latitude || value.latitude === 0) {
                            site.setValue('latitude', value.latitude);
                        }

                        await site.save(null, { useMasterKey: true }).fail((e) => {
                            throw e;
                        });
                    } catch (e) {
                        resMessages[index] = Parser.E2ResMessage(e, resMessages[index]);

                        Print.Log(e, new Error(), 'error');
                    }
                }),
            );

            return resMessages;
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

type OutputD = IResponse.IMultiData[];

action.delete(
    {
        inputType: 'InputD',
        middlewares: [Middleware.MultiDataFromQuery],
    },
    async (data): Promise<OutputD> => {
        try {
            let _input: InputD = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);
            let _objectIds: string[] = data.parameters.objectIds;
            let resMessages: OutputD = data.parameters.resMessages;

            await Promise.all(
                _objectIds.map(async (value, index, array) => {
                    try {
                        let site = await new Parse.Query(IDB.LocationSite)
                            .equalTo('objectId', value)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (!site) {
                            throw Errors.throw(Errors.CustomNotExists, ['site not found']);
                        }

                        let areas: IDB.LocationArea[] = await new Parse.Query(IDB.LocationArea)
                            .equalTo('site', site)
                            .find()
                            .fail((e) => {
                                throw e;
                            });

                        let groups: IDB.UserGroup[] = await new Parse.Query(IDB.UserGroup)
                            .containedIn('sites', [site])
                            .find()
                            .fail((e) => {
                                throw e;
                            });

                        let tags: IDB.Tag[] = await new Parse.Query(IDB.Tag)
                            .containedIn('sites', [site])
                            .find()
                            .fail((e) => {
                                throw e;
                            });

                        await site.destroy({ useMasterKey: true }).fail((e) => {
                            throw e;
                        });

                        try {
                            File.DeleteFile(`${File.assetsPath}/${site.getValue('imageSrc')}`);
                        } catch (e) {}

                        await Promise.all(
                            areas.map(async (value1, index1, array1) => {
                                await value1.destroy({ useMasterKey: true }).fail((e) => {
                                    throw e;
                                });

                                try {
                                    File.DeleteFile(`${File.assetsPath}/${value1.getValue('imageSrc')}`);
                                } catch (e) {}

                                try {
                                    File.DeleteFile(`${File.assetsPath}/${value1.getValue('mapSrc')}`);
                                } catch (e) {}
                            }),
                        );

                        await Promise.all(
                            groups.map(async (value1, index1, array1) => {
                                let sites: IDB.LocationSite[] = value1.getValue('sites').filter((value2, index2, array2) => {
                                    return value2.id !== value;
                                });
                                value1.setValue('sites', sites);

                                await value1.save(null, { useMasterKey: true }).fail((e) => {
                                    throw e;
                                });
                            }),
                        );

                        await Promise.all(
                            tags.map(async (value1, index1, array1) => {
                                let sites: IDB.LocationSite[] = value1.getValue('sites').filter((value2, index2, array2) => {
                                    return value2.id !== value;
                                });
                                value1.setValue('sites', sites);

                                await value1.save(null, { useMasterKey: true }).fail((e) => {
                                    throw e;
                                });
                            }),
                        );
                    } catch (e) {
                        resMessages[index] = Parser.E2ResMessage(e, resMessages[index]);

                        Print.Log(e, new Error(), 'error');
                    }
                }),
            );

            return resMessages;
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
