import { IUser, Action, Restful, RoleList, Errors, Socket } from 'core/cgi-package';
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

const size: Draw.ISize = { width: 900, height: 600 };

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
    },
    async (data): Promise<OutputC> => {
        let _input: InputC = await Ast.requestValidation('InputC', data.parameters.datas);

        try {
            let _userInfo = await Db.GetUserInfo(data.request, data.user);
            let resMessages: OutputC = data.parameters.resMessages;

            let root: IDB.LocationRegion = await CreateRoot();

            await Promise.all(
                _input.map(async (value, index, array) => {
                    try {
                        let parent: IDB.LocationRegion = undefined;
                        if (!value.parentId) {
                            parent = root;
                        } else {
                            parent = await new Parse.Query(IDB.LocationRegion).get(value.parentId).fail((e) => {
                                throw e;
                            });
                            if (!parent) {
                                throw Errors.throw(Errors.CustomBadRequest, ['parent region not found']);
                            }
                        }

                        if (parent.getValue('level') >= value.level) {
                            throw Errors.throw(Errors.CustomBadRequest, [`level must bigger than ${parent.getValue('level')}`]);
                        }

                        let extension = File.GetBase64Extension(value.imageBase64);
                        if (!extension || extension.type !== 'image') {
                            throw Errors.throw(Errors.CustomBadRequest, ['media type error']);
                        }

                        value.imageBase64 = (await Draw.Resize(Buffer.from(File.GetBase64Data(value.imageBase64), Parser.Encoding.base64), size, true, true)).toString(Parser.Encoding.base64);

                        let region: IDB.LocationRegion = await parent.addLeaf({
                            name: value.name,
                            level: value.level,
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
    },
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);
            let _paging: IRequest.IPaging = _input.paging;

            let root: IDB.LocationRegion = await CreateRoot();

            let query: Parse.Query<IDB.LocationRegion> = new Parse.Query(IDB.LocationRegion);

            if (_input.parentId) {
                let parent: IDB.LocationRegion = await new Parse.Query(IDB.LocationRegion).get(_input.parentId).fail((e) => {
                    throw e;
                });
                if (!parent) {
                    throw Errors.throw(Errors.CustomBadRequest, ['parent not found']);
                }

                query.greaterThan('lft', parent.getValue('lft')).lessThan('rgt', parent.getValue('rgt'));
            }
            if (_input.level) {
                query.equalTo('level', _input.level);
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

                    return {
                        objectId: value.id,
                        parentId: parents.length > 0 ? parents[parents.length - 1].id : _input.parentId,
                        name: value.getValue('name'),
                        level: value.getValue('level'),
                        imageSrc: value.getValue('imageSrc'),
                        longitude: value.getValue('longitude'),
                        latitude: value.getValue('latitude'),
                        lft: value.getValue('lft'),
                        rgt: value.getValue('rgt'),
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
    },
    async (data): Promise<OutputU> => {
        let _input: InputU = await Ast.requestValidation('InputU', data.parameters.datas);

        try {
            let _userInfo = await Db.GetUserInfo(data.request, data.user);
            let resMessages: OutputU = data.parameters.resMessages;

            await Promise.all(
                _input.map(async (value, index, array) => {
                    try {
                        let region: IDB.LocationRegion = await new Parse.Query(IDB.LocationRegion).get(value.objectId).fail((e) => {
                            throw e;
                        });
                        if (!region) {
                            throw Errors.throw(Errors.CustomBadRequest, ['region not found']);
                        }
                        if (!region.getValue('level')) {
                            throw Errors.throw(Errors.CustomBadRequest, ['can not update root']);
                        }

                        let extension = value.imageBase64 ? File.GetBase64Extension(value.imageBase64) : { extension: 'aa', type: 'image' };
                        if (!extension || extension.type !== 'image') {
                            throw Errors.throw(Errors.CustomBadRequest, ['media type error']);
                        }

                        if (value.name) {
                            region.setValue('name', value.name);
                        }
                        if (value.level) {
                            if (value.level > region.getValue('level')) {
                                let children: IDB.LocationRegion = (await region.getChildren()).find((value1, index1, array1) => {
                                    return value1.getValue('level') === value.level;
                                });
                                if (children) {
                                    throw Errors.throw(Errors.CustomBadRequest, [`level ${value.level} was presence`]);
                                }
                            } else if (value.level < region.getValue('level')) {
                                let parent: IDB.LocationRegion = await region.getParentLeaf();

                                if (parent.getValue('level') >= value.level) {
                                    throw Errors.throw(Errors.CustomBadRequest, [`level must bigger than ${parent.getValue('level')}`]);
                                }
                            }

                            region.setValue('level', value.level);
                        }
                        if (value.imageBase64) {
                            value.imageBase64 = (await Draw.Resize(Buffer.from(File.GetBase64Data(value.imageBase64), Parser.Encoding.base64), size, true, true)).toString(Parser.Encoding.base64);
                            let imageSrc: string = region.getValue('imageSrc');
                            File.WriteBase64File(`${File.assetsPath}/${imageSrc}`, value.imageBase64);
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
                        var region = await new Parse.Query(IDB.LocationRegion).get(value).fail((e) => {
                            throw e;
                        });
                        if (!region) {
                            throw Errors.throw(Errors.CustomNotExists, ['region not found']);
                        }

                        let childrens: IDB.LocationRegion[] = await region.getChildren();

                        await region.destroy({ useMasterKey: true }).fail((e) => {
                            throw e;
                        });

                        childrens.forEach((value, index, array) => {
                            if (value.getValue('imageSrc')) {
                                try {
                                    File.DeleteFile(`${File.assetsPath}/${value.getValue('imageSrc')}`);
                                } catch (e) {}
                            }
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
 * Create root
 */
export async function CreateRoot(): Promise<IDB.LocationRegion> {
    try {
        let root: IDB.LocationRegion = await IDB.LocationRegion.getRoot();
        if (!root) {
            root = await IDB.LocationRegion.setRoot({
                name: 'root',
                level: 0,
                imageSrc: '',
            });
        }

        return root;
    } catch (e) {
        throw e;
    }
}
