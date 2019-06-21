import { IUser, Action, Restful, RoleList, Errors, Socket, Config } from 'core/cgi-package';
import { default as Ast } from 'services/ast-services/ast-client';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, File, Parser, Db, Draw } from '../../../custom/helpers';
import * as Middleware from '../../../custom/middlewares';
// import * as Enum from '../../../custom/enums';
import * as Area from '../area';
import * as Tag from '../../tag';
// import * as OfficeHour from '../../office-hour';
// import * as UserGroup from '../../user/group';
// import * as Campaign from '../../event/campaign';

let action = new Action({
    loginRequired: true,
    permission: [RoleList.Admin],
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
                        
                        let site: IDB.LocationSite = await new Parse.Query(IDB.LocationSite)
                            .equalTo('name', value.name)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (site) {
                            throw Errors.throw(Errors.CustomBadRequest, ['duplicate name']);
                        }


                        site = new IDB.LocationSite();

                        site.setValue('name', value.name);
                        site.setValue('address', value.address);
                        site.setValue('longitude', value.longitude);
                        site.setValue('latitude', value.latitude);

                        await site.save(null, { useMasterKey: true }).fail((e) => {
                            throw e;
                        });

                        resMessages[index].objectId = site.id;

                    } catch (e) {
                        resMessages[index] = Parser.E2ResMessage(e, resMessages[index]);

                        Print.Log(e, new Error(), 'error');
                    }
                }),
            );

            IDB.LocationSite$.next({ crud: 'c' });

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

            if (_input.keyword) {
                let query1 = new Parse.Query(IDB.LocationSite).matches('name', new RegExp(_input.keyword), 'i');
                query = Parse.Query.or(query1);
            }

            if (_input.objectId) {
                query.equalTo('objectId', _input.objectId);
            }

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

            // let officeHours: IDB.OfficeHour[] = await new Parse.Query(IDB.OfficeHour)
            //     .containedIn('sites', sites)
            //     .find()
            //     .fail((e) => {
            //         throw e;
            //     });

            let areas: IDB.LocationArea[] = await new Parse.Query(IDB.LocationArea)
                .containedIn('site', sites)
                .find()
                .fail((e) => {
                    throw e;
                });

            // let deviceGroups: IDB.DeviceGroup[] = await new Parse.Query(IDB.DeviceGroup)
            //     .containedIn('site', sites)
            //     .find()
            //     .fail((e) => {
            //         throw e;
            //     });

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

                    // let officeHour: IDB.OfficeHour = officeHours.find((value1, index1, array1) => {
                    //     let siteIds: string[] = value1.getValue('sites').map((value2, index2, array2) => {
                    //         return value2.id;
                    //     });

                    //     return siteIds.indexOf(value.id) > -1;
                    // });
                    // let officeHourObject: IResponse.IObject = officeHour
                    //     ? {
                    //           objectId: value.id,
                    //           name: officeHour.getValue('name'),
                    //       }
                    //     : undefined;

                    let areaCount: number = areas.filter((value1, index1, array1) => {
                        return value1.getValue('site').id === value.id;
                    }).length;

                    // let deviceGroupCount: number = deviceGroups.filter((value1, index1, array1) => {
                    //     return value1.getValue('site').id === value.id;
                    // }).length;

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
                        // officeHour: officeHourObject,
                        officeHour: null,
                        imageSrc: value.getValue('imageSrc'),
                        longitude: value.getValue('longitude'),
                        latitude: value.getValue('latitude'),
                        areaCount: areaCount,
                        // deviceGroupCount: deviceGroupCount,
                        deviceGroupCount: 0
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

                       

                        if (value.name || value.name === '') {
                            site.setValue('name', value.name);
                        }
                       
                        if (value.address || value.address === '') {
                            site.setValue('address', value.address);
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

            IDB.LocationSite$.next({ crud: 'u' });

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

                        await Delete(site);
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
 * Delete site
 * @param objectId
 */
export async function Delete(site: IDB.LocationSite): Promise<void> {
    try {
        // await OfficeHour.UnbindingSite(site);

        // await Tag.UnbindingSite(site);

        // await UserGroup.UnbindingSite(site);

        // await Campaign.UnbindingSite(site);

        await Area.Deletes(site);

        await site.destroy({ useMasterKey: true }).fail((e) => {
            throw e;
        });

        try {
            File.DeleteFile(`${File.assetsPath}/${site.getValue('imageSrc')}`);
        } catch (e) {}

        IDB.LocationSite$.next({ crud: 'd' });
    } catch (e) {
        throw e;
    }
}

/**
 * Unbinding site region
 * @param region
 */
export async function UnbindingRegion(region: IDB.LocationRegion): Promise<void> {
    try {
        let sites: IDB.LocationSite[] = await new Parse.Query(IDB.LocationSite)
            .equalTo('region', region)
            .find()
            .fail((e) => {
                throw e;
            });

        await Promise.all(
            sites.map(async (value, index, array) => {
                value.unset('region');

                await value.save(null, { useMasterKey: true }).fail((e) => {
                    throw e;
                });

                IDB.LocationSite$.next({ crud: 'u' });
            }),
        );
    } catch (e) {
        throw e;
    }
}
