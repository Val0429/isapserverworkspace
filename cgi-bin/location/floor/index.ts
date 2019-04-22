import { IUser, Action, Restful, RoleList, Errors, Socket } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, File, Utility } from '../../../custom/helpers';
import * as Enum from '../../../custom/enums';

let action = new Action({
    loginRequired: true,
});

export default action;

/**
 * Action Create
 */
type InputC = IRequest.ILocation.IFloorC;

type OutputC = IResponse.ILocation.IFloorC;

action.post(
    {
        inputType: 'InputC',
        permission: [RoleList.Admin],
        postSizeLimit: 10000000,
    },
    async (data): Promise<OutputC> => {
        try {
            let _input: InputC = data.inputType;

            let extension = File.GetExtension(_input.imageBase64);
            if (!extension || extension.type !== 'image') {
                throw Errors.throw(Errors.CustomBadRequest, ['media type error']);
            }

            let floor: IDB.LocationFloor = new IDB.LocationFloor();

            floor.setValue('creator', data.user);
            floor.setValue('isDeleted', false);
            floor.setValue('name', _input.name);
            floor.setValue('floorNo', _input.floorNo);
            floor.setValue('imageSrc', '');
            floor.setValue('imageWidth', _input.imageWidth);
            floor.setValue('imageHeight', _input.imageHeight);

            await floor.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });

            let imageSrc: string = `${extension.type}s/${floor.id}_floor_${floor.createdAt.getTime()}.${extension.extension}`;
            File.WriteBase64File(`${File.assetsPath}/${imageSrc}`, _input.imageBase64);

            floor.setValue('imageSrc', imageSrc);

            await floor.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });

            return {
                objectId: floor.id,
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

type OutputR = IResponse.IDataList<IResponse.ILocation.IFloorR>;

action.get(
    {
        inputType: 'InputR',
        permission: [RoleList.Admin, RoleList.User],
    },
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;
            let _paging: IRequest.IPaging = _input.paging || { page: 1, pageSize: 10 };
            let _page: number = _paging.page || 1;
            let _pageSize: number = _paging.pageSize || 10;

            let query: Parse.Query<IDB.LocationFloor> = new Parse.Query(IDB.LocationFloor).equalTo('isDeleted', false);

            let total: number = await query.count().fail((e) => {
                throw e;
            });
            let totalPage: number = Math.ceil(total / _pageSize);

            let floors: IDB.LocationFloor[] = await query
                .descending('floorNo')
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
                results: floors.map((value, index, array) => {
                    return {
                        objectId: value.id,
                        name: value.getValue('name'),
                        floorNo: value.getValue('floorNo'),
                        imageSrc: value.getValue('imageSrc'),
                        imageWidth: value.getValue('imageWidth'),
                        imageHeight: value.getValue('imageHeight'),
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
type InputU = IRequest.ILocation.IFloorU;

type OutputU = Date;

action.put(
    {
        inputType: 'InputU',
        permission: [RoleList.Admin],
        postSizeLimit: 10000000,
    },
    async (data): Promise<OutputU> => {
        try {
            let _input: InputU = data.inputType;

            let floor: IDB.LocationFloor = await new Parse.Query(IDB.LocationFloor).get(_input.objectId).fail((e) => {
                throw e;
            });
            if (!floor) {
                throw Errors.throw(Errors.CustomBadRequest, ['floor not found']);
            }

            let extension = _input.imageBase64 ? File.GetExtension(_input.imageBase64) : { extension: 'aa', type: 'image' };
            if (!extension || extension.type !== 'image') {
                throw Errors.throw(Errors.CustomBadRequest, ['media type error']);
            }

            if (_input.name) {
                floor.setValue('name', _input.name);
            }
            if (_input.floorNo || _input.floorNo === 0) {
                floor.setValue('floorNo', _input.floorNo);
            }
            if (_input.imageBase64) {
                let imageSrc: string = floor.getValue('imageSrc');
                File.WriteBase64File(`${File.assetsPath}/${imageSrc}`, _input.imageBase64);
            }
            if (_input.imageWidth || _input.imageWidth === 0) {
                floor.setValue('imageWidth', _input.imageWidth);
            }
            if (_input.imageHeight || _input.imageHeight === 0) {
                floor.setValue('imageHeight', _input.imageHeight);
            }

            await floor.save(null, { useMasterKey: true }).fail((e) => {
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
 * Action Delete
 */
type InputD = IRequest.ILocation.IFloorD;

type OutputD = Date;

action.delete(
    {
        inputType: 'InputD',
        permission: [RoleList.Admin],
    },
    async (data): Promise<OutputD> => {
        try {
            let _input: InputD = data.inputType;

            let floor: IDB.LocationFloor = await new Parse.Query(IDB.LocationFloor).get(_input.objectId).fail((e) => {
                throw e;
            });
            if (!floor) {
                throw Errors.throw(Errors.CustomBadRequest, ['floor not found']);
            }

            floor.setValue('isDeleted', true);
            floor.setValue('deleter', data.user);

            await floor.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });

            Utility.ReStartServer();

            return new Date();
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
