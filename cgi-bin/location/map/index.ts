import { IUser, Action, Restful, RoleList, Errors, Socket } from 'core/cgi-package';
import { default as Ast } from 'services/ast-services/ast-client';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, File, Parser } from '../../../custom/helpers';
import * as Middleware from '../../../custom/middlewares';
import * as Enum from '../../../custom/enums';

let action = new Action({
    loginRequired: true,
    permission: [],
});

export default action;

type MultiData = IRequest.IMultiData;

/**
 * Action Create
 */
type InputC = IRequest.ILocation.IMapIndexC[];

type OutputC = IResponse.IMultiData[];

action.post(
    {
        inputType: 'MultiData',
        permission: [RoleList.Admin],
        postSizeLimit: 10000000,
        middlewares: [Middleware.MultiDataFromBody],
    },
    async (data): Promise<OutputC> => {
        let _input: InputC = await Ast.requestValidation('InputC', data.parameters.datas);

        try {
            let resMessages: OutputC = data.parameters.resMessages;

            let root: IDB.LocationMap = await IDB.LocationMap.getRoot();
            if (!root) {
                root = await IDB.LocationMap.setRoot(undefined);
            }

            await Promise.all(
                _input.map(async (value, index, array) => {
                    try {
                        let parent: IDB.LocationMap = undefined;
                        if (!value.parentId) {
                            parent = root;
                        } else {
                            parent = await new Parse.Query(IDB.LocationMap).get(value.parentId).fail((e) => {
                                throw e;
                            });
                            if (!parent) {
                                throw Errors.throw(Errors.CustomBadRequest, ['parent location not found']);
                            }
                        }

                        if (parent.getValue('level') && parent.getValue('level') >= value.level) {
                            throw Errors.throw(Errors.CustomBadRequest, [`level must be after ${Enum.ELocationLevel[parent.getValue('level')]}`]);
                        }

                        let extension = File.GetExtension(value.imageBase64);
                        if (!extension || extension.type !== 'image') {
                            throw Errors.throw(Errors.CustomBadRequest, ['media type error']);
                        }

                        let location: IDB.LocationMap = await parent.addLeaf({
                            name: value.name,
                            level: value.level,
                            imageSrc: '',
                            imageWidth: value.imageWidth,
                            imageHeight: value.imageHeight,
                            longitude: value.longitude,
                            latitude: value.latitude,
                            x: value.x,
                            y: value.y,
                            dataWindowX: value.dataWindowX,
                            dataWindowY: value.dataWindowY,
                        });

                        resMessages[index].objectId = location.id;

                        let imageSrc: string = `${extension.type}s/${location.id}_location_${location.createdAt.getTime()}.${extension.extension}`;
                        File.WriteBase64File(`${File.assetsPath}/${imageSrc}`, value.imageBase64);

                        location.setValue('imageSrc', imageSrc);

                        await location.save(null, { useMasterKey: true }).fail((e) => {
                            throw e;
                        });
                    } catch (e) {
                        resMessages[index] = Parser.E2ResMessage(e, resMessages[index]);

                        Print.Log(e, new Error(), 'error');
                    }
                }),
            );

            IDB.LocationMap$.next({ crud: 'c' });

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
type InputR = IRequest.IDataList & IRequest.ILocation.IMapIndexR;

type OutputR = IResponse.IDataList<IResponse.ILocation.IMapIndexR>;

action.get(
    {
        inputType: 'InputR',
        permission: [RoleList.Admin, RoleList.User],
        middlewares: [Middleware.PagingRequestDefaultValue],
    },
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;
            let _paging: IRequest.IPaging = _input.paging;

            let root: IDB.LocationMap = await IDB.LocationMap.getRoot();
            if (!root) {
                root = await IDB.LocationMap.setRoot(undefined);
            }

            let query: Parse.Query<IDB.LocationMap> = new Parse.Query(IDB.LocationMap).notEqualTo('level', null);

            if (_input.parentId) {
                let parent: IDB.LocationMap = await new Parse.Query(IDB.LocationMap).get(_input.parentId).fail((e) => {
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

            let locations: IDB.LocationMap[] = await query
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
                results: locations.map((value, index, array) => {
                    let parents: IDB.LocationMap[] = array.filter((value1, index1, array1) => {
                        return value1.getValue('lft') < value.getValue('lft') && value1.getValue('rgt') > value.getValue('rgt');
                    });

                    return {
                        objectId: value.id,
                        parentId: parents.length > 0 ? parents[parents.length - 1].id : _input.parentId,
                        name: value.getValue('name'),
                        level: Enum.ELocationLevel[value.getValue('level')],
                        imageSrc: value.getValue('imageSrc'),
                        imageWidth: value.getValue('imageWidth'),
                        imageHeight: value.getValue('imageHeight'),
                        longitude: value.getValue('longitude'),
                        latitude: value.getValue('latitude'),
                        x: value.getValue('x'),
                        y: value.getValue('y'),
                        dataWindowX: value.getValue('dataWindowX'),
                        dataWindowY: value.getValue('dataWindowY'),
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
type InputU = IRequest.ILocation.IMapIndexU[];

type OutputU = IResponse.IMultiData[];

action.put(
    {
        inputType: 'MultiData',
        permission: [RoleList.Admin],
        postSizeLimit: 10000000,
        middlewares: [Middleware.MultiDataFromBody],
    },
    async (data): Promise<OutputU> => {
        let _input: InputU = await Ast.requestValidation('InputU', data.parameters.datas);

        try {
            let resMessages: OutputU = data.parameters.resMessages;

            await Promise.all(
                _input.map(async (value, index, array) => {
                    try {
                        let location: IDB.LocationMap = await new Parse.Query(IDB.LocationMap).get(value.objectId).fail((e) => {
                            throw e;
                        });
                        if (!location) {
                            throw Errors.throw(Errors.CustomBadRequest, ['location not found']);
                        }
                        if (!location.getValue('level')) {
                            throw Errors.throw(Errors.CustomBadRequest, ['can not update root']);
                        }

                        let extension = value.imageBase64 ? File.GetExtension(value.imageBase64) : { extension: 'aa', type: 'image' };
                        if (!extension || extension.type !== 'image') {
                            throw Errors.throw(Errors.CustomBadRequest, ['media type error']);
                        }

                        if (value.name) {
                            location.setValue('name', value.name);
                        }
                        if (value.level) {
                            if (value.level > location.getValue('level')) {
                                let childrens: IDB.LocationMap[] = await location.getChildren();
                                let children: IDB.LocationMap = childrens.find((value1, index1, array1) => {
                                    return value1.getValue('level') === value.level;
                                });
                                if (children) {
                                    throw Errors.throw(Errors.CustomBadRequest, [`${Enum.ELocationLevel[value.level]} was presence`]);
                                }
                            } else if (value.level < location.getValue('level')) {
                                let parent: IDB.LocationMap = await location.getParentLeaf();

                                if (parent.getValue('level') && parent.getValue('level') >= value.level) {
                                    throw Errors.throw(Errors.CustomBadRequest, [`level must be after ${Enum.ELocationLevel[parent.getValue('level')]}`]);
                                }
                            }

                            location.setValue('level', value.level);
                        }
                        if (value.imageBase64) {
                            let imageSrc: string = location.getValue('imageSrc');
                            File.WriteBase64File(`${File.assetsPath}/${imageSrc}`, value.imageBase64);
                        }
                        if (value.imageWidth || value.imageWidth === 0) {
                            location.setValue('imageWidth', value.imageWidth);
                        }
                        if (value.imageHeight || value.imageHeight === 0) {
                            location.setValue('imageHeight', value.imageHeight);
                        }
                        if (value.longitude || value.longitude === 0) {
                            location.setValue('longitude', value.longitude);
                        }
                        if (value.latitude || value.latitude === 0) {
                            location.setValue('latitude', value.latitude);
                        }
                        if (value.x || value.x === 0) {
                            location.setValue('x', value.x);
                        }
                        if (value.y || value.y === 0) {
                            location.setValue('y', value.y);
                        }
                        if (value.dataWindowX || value.dataWindowX === 0) {
                            location.setValue('dataWindowX', value.dataWindowX);
                        }
                        if (value.dataWindowY || value.dataWindowY === 0) {
                            location.setValue('dataWindowY', value.dataWindowY);
                        }

                        await location.save(null, { useMasterKey: true }).fail((e) => {
                            throw e;
                        });
                    } catch (e) {
                        resMessages[index] = Parser.E2ResMessage(e, resMessages[index]);

                        Print.Log(e, new Error(), 'error');
                    }
                }),
            );

            IDB.LocationMap$.next({ crud: 'u' });

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
        permission: [RoleList.Admin],
        middlewares: [Middleware.MultiDataFromQuery],
    },
    async (data): Promise<OutputD> => {
        try {
            let _input: InputD = data.inputType;
            let _objectIds: string[] = data.parameters.objectIds;
            let resMessages: OutputD = data.parameters.resMessages;

            await Promise.all(
                _objectIds.map(async (value, index, array) => {
                    try {
                        var location = await new Parse.Query(IDB.LocationMap).get(value).fail((e) => {
                            throw e;
                        });
                        if (!location) {
                            throw Errors.throw(Errors.CustomNotExists, ['location not found']);
                        }

                        let locations: IDB.LocationMap[] = await location.getChildren();

                        await location.destroy({ useMasterKey: true }).fail((e) => {
                            throw e;
                        });

                        locations.forEach((value, index, array) => {
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

            IDB.LocationMap$.next({ crud: 'd' });

            return resMessages;
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
