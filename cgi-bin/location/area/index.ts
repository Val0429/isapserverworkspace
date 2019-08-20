import { IUser, Action, Restful, RoleList, Errors, Socket, Config } from 'core/cgi-package';
import { default as Ast } from 'services/ast-services/ast-client';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, File, Utility, Db, Draw } from '../../../custom/helpers';
import * as Middleware from '../../../custom/middlewares';
import * as Enum from '../../../custom/enums';

let action = new Action({
    loginRequired: true,
});

export default action;

type MultiData = IRequest.IMultiData;

/**
 * Action Create
 */
type InputC = IRequest.ILocation.IAreaIndexC[];

type OutputC = IResponse.IMultiData;

action.post(
    {
        inputType: 'MultiData',
        postSizeLimit: 10000000,
        middlewares: [Middleware.MultiDataFromBody],
        permission: [RoleList.SuperAdministrator, RoleList.Admin],
    },
    async (data): Promise<OutputC> => {
        let _input: InputC = await Ast.requestValidation('InputC', data.parameters.datas);

        try {
            let _userInfo = await Db.GetUserInfo(data.request, data.user);
            let resMessages: IResponse.IResponseMessage[] = data.parameters.resMessages;

            let imgConfig = Config.location.image;
            let imgSize = { width: imgConfig.width, height: imgConfig.height };

            await Promise.all(
                _input.map(async (value, index, array) => {
                    try {
                        let imageExtension = File.GetBase64Extension(value.imageBase64);
                        if (!imageExtension || imageExtension.type !== 'image') {
                            throw Errors.throw(Errors.CustomBadRequest, ['media type error']);
                        }
                        let mapExtension = File.GetBase64Extension(value.mapBase64);
                        if (!mapExtension || mapExtension.type !== 'image') {
                            throw Errors.throw(Errors.CustomBadRequest, ['media type error']);
                        }

                        let site: IDB.LocationSite = await new Parse.Query(IDB.LocationSite)
                            .equalTo('objectId', value.siteId)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (!site) {
                            throw Errors.throw(Errors.CustomBadRequest, ['site not found']);
                        }

                        let area: IDB.LocationArea = await new Parse.Query(IDB.LocationArea)
                            .equalTo('site', site)
                            .equalTo('name', value.name)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (area) {
                            throw Errors.throw(Errors.CustomBadRequest, ['duplicate name']);
                        }

                        value.imageBase64 = (await Draw.Resize(Buffer.from(File.GetBase64Data(value.imageBase64), Enum.EEncoding.base64), imgSize, imgConfig.isFill, imgConfig.isTransparent)).toString(Enum.EEncoding.base64);
                        value.mapBase64 = (await Draw.Resize(Buffer.from(File.GetBase64Data(value.mapBase64), Enum.EEncoding.base64), imgSize, imgConfig.isFill, imgConfig.isTransparent)).toString(Enum.EEncoding.base64);

                        area = new IDB.LocationArea();

                        area.setValue('site', site);
                        area.setValue('name', value.name);
                        area.setValue('imageSrc', '');
                        area.setValue('mapSrc', '');
                        area.setValue('threshold', SortThreshold(value.threshold));

                        await area.save(null, { useMasterKey: true }).fail((e) => {
                            throw e;
                        });

                        resMessages[index].objectId = area.id;

                        let imageSrc: string = `${imageExtension.type}s/${area.id}_location_area_image_${area.createdAt.getTime()}.${imageExtension.extension}`;
                        File.WriteBase64File(`${File.assetsPath}/${imageSrc}`, value.imageBase64);

                        area.setValue('imageSrc', imageSrc);

                        let mapSrc: string = `${mapExtension.type}s/${area.id}_location_area_map_${area.createdAt.getTime()}.${mapExtension.extension}`;
                        File.WriteBase64File(`${File.assetsPath}/${mapSrc}`, value.mapBase64);

                        area.setValue('mapSrc', mapSrc);

                        await area.save(null, { useMasterKey: true }).fail((e) => {
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
 * Action Read
 */
type InputR = IRequest.IDataList & IRequest.ILocation.IAreaIndexR;

type OutputR = IResponse.IDataList<IResponse.ILocation.IAreaIndexR>;

action.get(
    {
        inputType: 'InputR',
        middlewares: [Middleware.PagingRequestDefaultValue],
        permission: [RoleList.SuperAdministrator, RoleList.Admin, RoleList.User],
    },
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);
            let _paging: IRequest.IPaging = _input.paging;

            let query: Parse.Query<IDB.LocationArea> = new Parse.Query(IDB.LocationArea);

            if (_input.keyword) {
                let query1 = new Parse.Query(IDB.LocationArea).matches('name', new RegExp(_input.keyword), 'i');
                query = Parse.Query.or(query1);
            }

            if (_input.objectId) {
                query.equalTo('objectId', _input.objectId);
            }
            if (_input.siteId) {
                let site: IDB.LocationSite = new IDB.LocationSite();
                site.id = _input.siteId;

                query.equalTo('site', site);
            }

            let total: number = await query.count().fail((e) => {
                throw e;
            });
            let totalPage: number = Math.ceil(total / _paging.pageSize);

            let areas: IDB.LocationArea[] = await query
                .skip((_paging.page - 1) * _paging.pageSize)
                .limit(_paging.pageSize)
                .include('site')
                .find()
                .fail((e) => {
                    throw e;
                });

            let deviceGroups: IDB.DeviceGroup[] = await new Parse.Query(IDB.DeviceGroup)
                .containedIn('area', areas)
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
                results: areas.map((value, index, array) => {
                    let site: IResponse.IObject = {
                        objectId: value.getValue('site').id,
                        name: value.getValue('site').getValue('name'),
                    };

                    let deviceGroupCount: number = deviceGroups.filter((value1, index1, array1) => {
                        return value1.getValue('area').id === value.id;
                    }).length;

                    return {
                        objectId: value.id,
                        site: site,
                        name: value.getValue('name'),
                        imageSrc: value.getValue('imageSrc'),
                        mapSrc: value.getValue('mapSrc'),
                        deviceGroupCount: deviceGroupCount,
                        threshold: value.getValue('threshold'),
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
type InputU = IRequest.ILocation.IAreaIndexU[];

type OutputU = IResponse.IMultiData;

action.put(
    {
        inputType: 'MultiData',
        postSizeLimit: 10000000,
        middlewares: [Middleware.MultiDataFromBody],
        permission: [RoleList.SuperAdministrator, RoleList.Admin],
    },
    async (data): Promise<OutputU> => {
        let _input: InputU = await Ast.requestValidation('InputU', data.parameters.datas);

        try {
            let _userInfo = await Db.GetUserInfo(data.request, data.user);
            let resMessages: IResponse.IResponseMessage[] = data.parameters.resMessages;

            let imgConfig = Config.location.image;
            let imgSize = { width: imgConfig.width, height: imgConfig.height };

            await Promise.all(
                _input.map(async (value, index, array) => {
                    try {
                        let imageExtension = value.imageBase64 ? File.GetBase64Extension(value.imageBase64) : { extension: 'aa', type: 'image' };
                        if (!imageExtension || imageExtension.type !== 'image') {
                            throw Errors.throw(Errors.CustomBadRequest, ['media type error']);
                        }
                        let mapExtension = value.mapBase64 ? File.GetBase64Extension(value.mapBase64) : { extension: 'aa', type: 'image' };
                        if (!mapExtension || mapExtension.type !== 'image') {
                            throw Errors.throw(Errors.CustomBadRequest, ['media type error']);
                        }

                        let area: IDB.LocationArea = await new Parse.Query(IDB.LocationArea)
                            .equalTo('objectId', value.objectId)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (!area) {
                            throw Errors.throw(Errors.CustomBadRequest, ['area not found']);
                        }

                        if (value.imageBase64) {
                            value.imageBase64 = (await Draw.Resize(Buffer.from(File.GetBase64Data(value.imageBase64), Enum.EEncoding.base64), imgSize, imgConfig.isFill, imgConfig.isTransparent)).toString(Enum.EEncoding.base64);
                            let imageSrc: string = `${imageExtension.type}s/${area.id}_location_area_image_${area.createdAt.getTime()}.${imageExtension.extension}`;
                            File.WriteBase64File(`${File.assetsPath}/${imageSrc}`, value.imageBase64);

                            area.setValue('imageSrc', imageSrc);
                        }
                        if (value.mapBase64) {
                            value.mapBase64 = (await Draw.Resize(Buffer.from(File.GetBase64Data(value.mapBase64), Enum.EEncoding.base64), imgSize, imgConfig.isFill, imgConfig.isTransparent)).toString(Enum.EEncoding.base64);
                            let mapSrc: string = `${mapExtension.type}s/${area.id}_location_area_map_${area.createdAt.getTime()}.${mapExtension.extension}`;
                            File.WriteBase64File(`${File.assetsPath}/${mapSrc}`, value.mapBase64);

                            area.setValue('mapSrc', mapSrc);
                        }
                        if (value.threshold) {
                            area.setValue('threshold', SortThreshold(value.threshold));
                        }

                        await area.save(null, { useMasterKey: true }).fail((e) => {
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
 * Action Delete
 */
type InputD = IRequest.IDelete;

type OutputD = IResponse.IMultiData;

action.delete(
    {
        inputType: 'InputD',
        middlewares: [Middleware.MultiDataFromQuery],
        permission: [RoleList.SuperAdministrator, RoleList.Admin],
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
                        let area: IDB.LocationArea = await new Parse.Query(IDB.LocationArea)
                            .equalTo('objectId', value)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (!area) {
                            throw Errors.throw(Errors.CustomBadRequest, ['area not found']);
                        }

                        await Delete(area);
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
 * Delete area
 * @param objectId
 */
export async function Delete(area: IDB.LocationArea): Promise<void> {
    try {
        await area.destroy({ useMasterKey: true }).fail((e) => {
            throw e;
        });

        try {
            File.DeleteFile(`${File.assetsPath}/${area.getValue('imageSrc')}`);
        } catch (e) {}

        try {
            File.DeleteFile(`${File.assetsPath}/${area.getValue('mapSrc')}`);
        } catch (e) {}
    } catch (e) {
        throw e;
    }
}

/**
 * Sort threshold
 * @param threshold
 */
export function SortThreshold(threshold: IDB.IThreshold): IDB.IThreshold {
    try {
        let thresholds: number[] = [];
        Object.keys(threshold).forEach((value1, index1, array1) => {
            thresholds.push(threshold[value1]);
        });

        thresholds.sort((a, b) => {
            return a - b;
        });

        threshold.low = thresholds[0];
        threshold.medium = thresholds[1];
        threshold.high = thresholds[2];

        return threshold;
    } catch (e) {
        throw e;
    }
}

/**
 * Delete when site was delete
 */
IDB.LocationSite.notice$
    .filter((x) => x.crud === 'd')
    .subscribe({
        next: async (x) => {
            try {
                let areas: IDB.LocationArea[] = await new Parse.Query(IDB.LocationArea)
                    .equalTo('site', x.data)
                    .find()
                    .fail((e) => {
                        throw e;
                    });

                await Promise.all(
                    areas.map(async (value, index, array) => {
                        await Delete(value);
                    }),
                );
            } catch (e) {
                Print.Log(e, new Error(), 'error');
            }
        },
    });
