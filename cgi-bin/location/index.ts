import { IUser, Action, Restful, RoleList, Errors, Socket, ParseObject } from 'core/cgi-package';
import { Tree, IGetTreeNodeR, IGetTreeNodeL } from 'models/nodes';
import { IRequest, IResponse, IDB } from '../../custom/models';
import { Print, File } from '../../custom/helpers';
import * as Enum from '../../custom/enums';

let action = new Action({
    loginRequired: true,
    permission: [],
});

export default action;

/**
 * Action Create
 */
type InputC = IRequest.ILocation.IIndexC;

type OutputC = IResponse.ILocation.IIndexC;

action.post(
    {
        inputType: 'InputC',
        permission: [RoleList.Admin],
        postSizeLimit: 10000000,
    },
    async (data): Promise<OutputC> => {
        try {
            let _input: InputC = data.inputType;

            let parent: IDB.Location = undefined;
            if (_input.level === 1) {
                parent = await IDB.Location.getRoot();
                if (!parent) {
                    parent = await IDB.Location.setRoot(undefined);
                }
            } else if (_input.parentId) {
                parent = await new Parse.Query(IDB.Location).get(_input.parentId).fail((e) => {
                    throw e;
                });
                if (!parent) {
                    throw Errors.throw(Errors.CustomBadRequest, ['parent location not found']);
                }
            } else {
                throw Errors.throw(Errors.CustomBadRequest, [`need parent id or type is ${Enum.ELocationLevel[0]}`]);
            }

            if (parent.getValue('level') && parent.getValue('level') >= _input.level) {
                throw Errors.throw(Errors.CustomBadRequest, [`level must be after ${Enum.ELocationLevel[parent.getValue('level')]}`]);
            }

            let extension = File.GetExtension(_input.imageBase64);
            if (!extension || extension.type !== 'image') {
                throw Errors.throw(Errors.CustomBadRequest, ['media type error']);
            }

            let location: IDB.Location = await parent.addLeaf({
                name: _input.name,
                level: _input.level,
                no: _input.no,
                imageSrc: '',
                imageWidth: _input.imageWidth,
                imageHeight: _input.imageHeight,
                longitude: _input.longitude,
                latitude: _input.latitude,
                x: _input.x,
                y: _input.y,
                dataWindowX: _input.dataWindowX,
                dataWindowY: _input.dataWindowY,
            });

            let imageSrc: string = `${extension.type}s/${location.id}_location_${location.createdAt.getTime()}.${extension.extension}`;
            File.WriteBase64File(`${File.assetsPath}/${imageSrc}`, _input.imageBase64);

            location.setValue('imageSrc', imageSrc);

            await location.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });

            IDB.Location$.next({ crud: 'c' });

            return {
                objectId: location.id,
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
type InputR = IRequest.IDataList & IRequest.ILocation.IIndexR;

type OutputR = IResponse.IDataList<IResponse.ILocation.IIndexR>;

action.get(
    { inputType: 'InputR' },
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;
            let _paging: IRequest.IPaging = _input.paging || { page: 1, pageSize: 10 };
            let _page: number = _paging.page || 1;
            let _pageSize: number = _paging.pageSize || 10;

            let query: Parse.Query<IDB.Location> = new Parse.Query(IDB.Location);

            if (_input.parentId) {
                let parent: IDB.Location = await new Parse.Query(IDB.Location).get(_input.parentId).fail((e) => {
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
            let totalPage: number = Math.ceil(total / _pageSize);

            let locations: IDB.Location[] = await query
                .skip((_page - 1) * _pageSize)
                .limit(_pageSize)
                .find()
                .fail((e) => {
                    throw e;
                });

            return {
                paging: {
                    total: total,
                    totalPages: totalPage,
                    page: _page,
                    pageSize: _pageSize,
                },
                results: locations.map((value, index, array) => {
                    let parents: IDB.Location[] = array.filter((value1, index1, array1) => {
                        return value1.getValue('lft') < value.getValue('lft') && value1.getValue('rgt') > value.getValue('rgt');
                    });

                    return {
                        objectId: value.id,
                        parentId: parents.length > 0 ? parents[parents.length - 1].id : _input.parentId,
                        name: value.getValue('name') || 'root',
                        level: value.getValue('level') ? Enum.ELocationLevel[value.getValue('level')] : 'root',
                        no: value.getValue('no'),
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
type InputU = IRequest.ILocation.IIndexU;

type OutputU = Date;

action.put(
    { inputType: 'InputU' },
    async (data): Promise<OutputU> => {
        try {
            let _input: InputU = data.inputType;

            let location: IDB.Location = await new Parse.Query(IDB.Location).get(_input.objectId).fail((e) => {
                throw e;
            });
            if (!location) {
                throw Errors.throw(Errors.CustomBadRequest, ['location not found']);
            }
            if (!location.getValue('level')) {
                throw Errors.throw(Errors.CustomBadRequest, ['can not update root']);
            }

            let extension = _input.imageBase64 ? File.GetExtension(_input.imageBase64) : { extension: 'aa', type: 'image' };
            if (!extension || extension.type !== 'image') {
                throw Errors.throw(Errors.CustomBadRequest, ['media type error']);
            }

            if (_input.name) {
                location.setValue('name', _input.name);
            }
            if (_input.level) {
                if (_input.level > location.getValue('level')) {
                    let childrens: IDB.Location[] = await location.getChildren();
                    let children: IDB.Location = childrens.find((value, index, array) => {
                        return value.getValue('level') === _input.level;
                    });
                    if (children) {
                        throw Errors.throw(Errors.CustomBadRequest, [`${Enum.ELocationLevel[_input.level]} was presence`]);
                    }
                } else if (_input.level < location.getValue('level')) {
                    let parent: IDB.Location = await location.getParentLeaf();

                    if (parent.getValue('level') && parent.getValue('level') >= _input.level) {
                        throw Errors.throw(Errors.CustomBadRequest, [`level must be after ${Enum.ELocationLevel[parent.getValue('level')]}`]);
                    }
                }

                location.setValue('level', _input.level);
            }
            if (_input.no || _input.no === 0) {
                location.setValue('no', _input.no);
            }
            if (_input.imageBase64) {
                let imageSrc: string = location.getValue('imageSrc');
                File.WriteBase64File(`${File.assetsPath}/${imageSrc}`, _input.imageBase64);
            }
            if (_input.imageWidth || _input.imageWidth === 0) {
                location.setValue('imageWidth', _input.imageWidth);
            }
            if (_input.imageHeight || _input.imageHeight === 0) {
                location.setValue('imageHeight', _input.imageHeight);
            }
            if (_input.longitude || _input.longitude === 0) {
                location.setValue('longitude', _input.longitude);
            }
            if (_input.latitude || _input.latitude === 0) {
                location.setValue('latitude', _input.latitude);
            }
            if (_input.x || _input.x === 0) {
                location.setValue('x', _input.x);
            }
            if (_input.y || _input.y === 0) {
                location.setValue('y', _input.y);
            }
            if (_input.dataWindowX || _input.dataWindowX === 0) {
                location.setValue('dataWindowX', _input.dataWindowX);
            }
            if (_input.dataWindowY || _input.dataWindowY === 0) {
                location.setValue('dataWindowY', _input.dataWindowY);
            }

            await location.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });

            IDB.Location$.next({ crud: 'u' });

            return new Date();
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);

/**
 * Action Delete
 */
type InputD = IRequest.ILocation.IIndexD;

type OutputD = Date;

action.delete(
    { inputType: 'InputD' },
    async (data): Promise<OutputD> => {
        try {
            let _input: InputD = data.inputType;

            var location = await new Parse.Query(IDB.Location).get(_input.objectId).fail((e) => {
                throw e;
            });
            if (!location) {
                throw Errors.throw(Errors.CustomNotExists, ['location not found']);
            }

            let locations: IDB.Location[] = await location.getChildren();

            await location.destroy({ useMasterKey: true }).fail((e) => {
                throw e;
            });

            locations.forEach((value, index, array) => {
                if (value.getValue('imageSrc')) {
                    File.DeleteFile(`${File.assetsPath}/${value.getValue('imageSrc')}`);
                }
            });

            IDB.Location$.next({ crud: 'd' });

            return new Date();
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
