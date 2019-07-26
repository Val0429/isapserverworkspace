import { IUser, Action, Restful, RoleList, Errors, Socket, Config } from 'core/cgi-package';
import { default as Ast } from 'services/ast-services/ast-client';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, File, Parser, Db, Draw } from '../../../custom/helpers';
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
type InputC = IRequest.ILocation.IRegionIndexC[];

type OutputC = IResponse.IMultiData[];

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
            let resMessages: OutputC = data.parameters.resMessages;

            let imgConfig = Config.location.image;
            let imgSize = { width: imgConfig.width, height: imgConfig.height };

            let root: IDB.LocationRegion = await CreateRoot();

            await Promise.all(
                _input.map(async (value, index, array) => {
                    try {
                        let parent: IDB.LocationRegion = undefined;
                        if (!value.parentId) {
                            parent = root;
                        } else {
                            parent = await new Parse.Query(IDB.LocationRegion)
                                .equalTo('objectId', value.parentId)
                                .first()
                                .fail((e) => {
                                    throw e;
                                });
                            if (!parent) {
                                throw Errors.throw(Errors.CustomBadRequest, ['parent region not found']);
                            }
                        }

                        let extension = File.GetBase64Extension(value.imageBase64);
                        if (!extension || extension.type !== 'image') {
                            throw Errors.throw(Errors.CustomBadRequest, ['media type error']);
                        }

                        let tags: IDB.Tag[] = await new Parse.Query(IDB.Tag)
                            .containedIn('objectId', value.tagIds)
                            .find()
                            .fail((e) => {
                                throw e;
                            });

                        value.imageBase64 = (await Draw.Resize(Buffer.from(File.GetBase64Data(value.imageBase64), Parser.Encoding.base64), imgSize, imgConfig.isFill, imgConfig.isTransparent)).toString(Parser.Encoding.base64);

                        let region: IDB.LocationRegion = await parent.addLeaf({
                            type: value.type,
                            name: value.name,
                            customId: value.customId,
                            address: value.address,
                            imageSrc: '',
                            longitude: value.longitude,
                            latitude: value.latitude,
                        });

                        resMessages[index].objectId = region.id;

                        let imageSrc: string = `${extension.type}s/${region.id}_location_region_${region.createdAt.getTime()}.${extension.extension}`;
                        File.WriteBase64File(`${File.assetsPath}/${imageSrc}`, value.imageBase64);

                        region.setValue('imageSrc', imageSrc);

                        await region.save(null, { useMasterKey: true }).fail((e) => {
                            throw e;
                        });

                        await Promise.all(
                            tags.map(async (value1, index1, array1) => {
                                value1.setValue('regions', value1.getValue('regions').concat(region));

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

/**
 * Action Read
 */
type InputR = IRequest.IDataList & IRequest.ILocation.IRegionIndexR;

type OutputR = IResponse.IDataList<IResponse.ILocation.IRegionIndexR>;

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

            let root: IDB.LocationRegion = await CreateRoot();

            let query: Parse.Query<IDB.LocationRegion> = new Parse.Query(IDB.LocationRegion);

            if (_input.keyword) {
                let query1 = new Parse.Query(IDB.LocationRegion).matches('name', new RegExp(_input.keyword), 'i');
                query = Parse.Query.or(query1);
            }

            if (_input.objectId) {
                query.equalTo('objectId', _input.objectId);
            }
            if (_input.parentId) {
                let parent: IDB.LocationRegion = await new Parse.Query(IDB.LocationRegion)
                    .equalTo('objectId', _input.parentId)
                    .first()
                    .fail((e) => {
                        throw e;
                    });
                if (!parent) {
                    throw Errors.throw(Errors.CustomBadRequest, ['parent not found']);
                }

                query.greaterThan('lft', parent.getValue('lft')).lessThan('rgt', parent.getValue('rgt'));
            }

            let total: number = await query.count().fail((e) => {
                throw e;
            });
            let totalPage: number = Math.ceil(total / _paging.pageSize);

            let regions: IDB.LocationRegion[] = await query
                .skip((_paging.page - 1) * _paging.pageSize)
                .limit(_paging.pageSize)
                .find()
                .fail((e) => {
                    throw e;
                });

            let tags: IDB.Tag[] = await new Parse.Query(IDB.Tag)
                .containedIn('regions', regions)
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
                results: regions.map((value, index, array) => {
                    let parents: IDB.LocationRegion[] = array.filter((value1, index1, array1) => {
                        return value1.getValue('lft') < value.getValue('lft') && value1.getValue('rgt') > value.getValue('rgt');
                    });

                    let tagObjects = tags
                        .filter((value1, index1, array1) => {
                            return !!value1.getValue('regions').find((value2, index2, array2) => {
                                return value2.id === value.id;
                            });
                        })
                        .map<IResponse.IObject>((value1, index1, array1) => {
                            return {
                                objectId: value1.id,
                                name: value1.getValue('name'),
                            };
                        });

                    return {
                        objectId: value.id,
                        parentId: parents.length > 0 ? parents[parents.length - 1].id : _input.parentId,
                        type: value.getValue('type'),
                        name: value.getValue('name'),
                        customId: value.getValue('customId'),
                        address: value.getValue('address'),
                        imageSrc: value.getValue('imageSrc'),
                        longitude: value.getValue('longitude'),
                        latitude: value.getValue('latitude'),
                        tags: tagObjects,
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
type InputU = IRequest.ILocation.IRegionIndexU[];

type OutputU = IResponse.IMultiData[];

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
            let resMessages: OutputU = data.parameters.resMessages;

            let imgConfig = Config.location.image;
            let imgSize = { width: imgConfig.width, height: imgConfig.height };

            await Promise.all(
                _input.map(async (value, index, array) => {
                    try {
                        let region: IDB.LocationRegion = await new Parse.Query(IDB.LocationRegion)
                            .equalTo('objectId', value.objectId)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (!region) {
                            throw Errors.throw(Errors.CustomBadRequest, ['region not found']);
                        }

                        let extension = value.imageBase64 ? File.GetBase64Extension(value.imageBase64) : { extension: 'aa', type: 'image' };
                        if (!extension || extension.type !== 'image') {
                            throw Errors.throw(Errors.CustomBadRequest, ['media type error']);
                        }

                        if (value.type || value.type === '') {
                            region.setValue('type', value.type);
                        }
                        if (value.name || value.name === '') {
                            region.setValue('name', value.name);
                        }
                        if (value.customId || value.customId === '') {
                            region.setValue('customId', value.customId);
                        }
                        if (value.address || value.address === '') {
                            region.setValue('address', value.address);
                        }
                        if (value.tagIds) {
                            let tags: IDB.Tag[] = await new Parse.Query(IDB.Tag)
                                .containedIn('regions', [region])
                                .find()
                                .fail((e) => {
                                    throw e;
                                });

                            await Promise.all(
                                tags.map(async (value1, index1, array1) => {
                                    if (value.tagIds.indexOf(value1.id) < 0) {
                                        let regions = value1.getValue('regions');
                                        regions = regions.filter((value2, index2, array2) => {
                                            return value2.id !== region.id;
                                        });

                                        value1.setValue('regions', regions);

                                        await value1.save(null, { useMasterKey: true }).fail((e) => {
                                            throw e;
                                        });
                                    }
                                }),
                            );

                            tags = await new Parse.Query(IDB.Tag)
                                .containedIn('objectId', value.tagIds)
                                .find()
                                .fail((e) => {
                                    throw e;
                                });

                            await Promise.all(
                                tags.map(async (value1, index1, array1) => {
                                    let regions = value1.getValue('regions');

                                    let _region = regions.find((value2, index2, array2) => {
                                        return value2.id === region.id;
                                    });
                                    if (!_region) {
                                        value1.setValue('regions', regions.concat(region));

                                        await value1.save(null, { useMasterKey: true }).fail((e) => {
                                            throw e;
                                        });
                                    }
                                }),
                            );
                        }
                        if (value.imageBase64) {
                            value.imageBase64 = (await Draw.Resize(Buffer.from(File.GetBase64Data(value.imageBase64), Parser.Encoding.base64), imgSize, imgConfig.isFill, imgConfig.isTransparent)).toString(Parser.Encoding.base64);
                            let imageSrc: string = `${extension.type}s/${region.id}_location_region_${region.createdAt.getTime()}.${extension.extension}`;
                            File.WriteBase64File(`${File.assetsPath}/${imageSrc}`, value.imageBase64);

                            region.setValue('imageSrc', imageSrc);
                        }
                        if (value.longitude || value.longitude === 0) {
                            region.setValue('longitude', value.longitude);
                        }
                        if (value.latitude || value.latitude === 0) {
                            region.setValue('latitude', value.latitude);
                        }

                        await region.save(null, { useMasterKey: true }).fail((e) => {
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
        permission: [RoleList.SuperAdministrator, RoleList.Admin],
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
                        var region = await new Parse.Query(IDB.LocationRegion)
                            .equalTo('objectId', value)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (!region) {
                            throw Errors.throw(Errors.CustomNotExists, ['region not found']);
                        }

                        await Delete(region);
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
 * Create root
 */
export async function CreateRoot(): Promise<IDB.LocationRegion> {
    try {
        let root: IDB.LocationRegion = await IDB.LocationRegion.getRoot();
        if (!root) {
            root = await IDB.LocationRegion.setRoot({
                name: 'root',
                type: 'root',
            });
        }

        return root;
    } catch (e) {
        throw e;
    }
}

/**
 * Delete region
 * @param objectId
 */
export async function Delete(region: IDB.LocationRegion): Promise<void> {
    try {
        let childrens: IDB.LocationRegion[] = await region.getChildren();

        await region.destroy({ useMasterKey: true }).fail((e) => {
            throw e;
        });

        await Promise.all(
            childrens.map(async (value, index, array) => {
                if (value.getValue('imageSrc')) {
                    try {
                        File.DeleteFile(`${File.assetsPath}/${value.getValue('imageSrc')}`);
                    } catch (e) {}
                }
            }),
        );
    } catch (e) {
        throw e;
    }
}
