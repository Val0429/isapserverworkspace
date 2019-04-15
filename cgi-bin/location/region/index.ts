import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { File, Print } from '../../../custom/helpers';
import * as Enum from '../../../custom/enums';

let action = new Action({
    loginRequired: true,
    permission: [RoleList.Admin],
});

export default action;

/**
 * Action Create
 */
type InputC = IRequest.ILocation.IRegionIndexC;

type OutputC = IResponse.ILocation.IRegionIndexC;

action.post(
    {
        inputType: 'InputC',
        postSizeLimit: 10000000,
    },
    async (data): Promise<OutputC> => {
        try {
            let _input: InputC = data.inputType;

            let extension: string = File.GetExtension(_input.imageBase64);
            if (!extension) {
                throw Errors.throw(Errors.CustomBadRequest, ['media type error']);
            }

            let region: IDB.LocationRegion = new IDB.LocationRegion();

            region.setValue('creator', data.user);
            region.setValue('isDeleted', false);
            region.setValue('name', _input.name);
            region.setValue('longitude', _input.longitude || 0);
            region.setValue('latitude', _input.latitude || 0);
            region.setValue('imageSrc', '');
            region.setValue('imageWidth', _input.imageWidth);
            region.setValue('imageHeight', _input.imageHeight);

            await region.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });

            let imageSrc: string = `images/${region.id}_region_${region.createdAt.getTime()}.${extension}`;
            File.WriteBase64File(`${File.assetsPath}/${imageSrc}`, _input.imageBase64);

            region.setValue('imageSrc', imageSrc);

            await region.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });

            return {
                regionId: region.id,
            };
        } catch (e) {
            Print.Log(new Error(JSON.stringify(e)), 'error');
            throw e;
        }
    },
);

/**
 * Action Read
 */
type InputR = IRequest.IDataList;

type OutputR = IResponse.IDataList<IResponse.ILocation.IRegionIndexR[]>;

action.get(
    { inputType: 'InputR' },
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;
            let _page: number = _input.page || 1;
            let _count: number = _input.count || 10;

            let query: Parse.Query<IDB.LocationRegion> = new Parse.Query(IDB.LocationRegion).equalTo('isDeleted', false);

            let total: number = await query.count().fail((e) => {
                throw e;
            });

            let regions: IDB.LocationRegion[] = await query
                .skip((_page - 1) * _count)
                .limit(_count)
                .find()
                .fail((e) => {
                    throw e;
                });

            return {
                total: total,
                page: _page,
                count: _count,
                content: regions.map((value, index, array) => {
                    return {
                        regionId: value.id,
                        name: value.getValue('name'),
                        longitude: value.getValue('longitude'),
                        latitude: value.getValue('latitude'),
                        imageSrc: value.getValue('imageSrc'),
                        imageWidth: value.getValue('imageWidth'),
                        imageHeight: value.getValue('imageHeight'),
                    };
                }),
            };
        } catch (e) {
            Print.Log(new Error(JSON.stringify(e)), 'error');
            throw e;
        }
    },
);

/**
 * Action update
 */
type InputU = IRequest.ILocation.IRegionIndexU;

type OutputU = Date;

action.put(
    {
        inputType: 'InputU',
        postSizeLimit: 10000000,
    },
    async (data): Promise<OutputU> => {
        try {
            let _input: InputU = data.inputType;

            let region: IDB.LocationRegion = await new Parse.Query(IDB.LocationRegion).get(_input.regionId).fail((e) => {
                throw e;
            });
            if (!region) {
                throw Errors.throw(Errors.CustomBadRequest, ['region not found']);
            }

            let extension: string = _input.imageBase64 ? File.GetExtension(_input.imageBase64) : 'aa';
            if (!extension) {
                throw Errors.throw(Errors.CustomBadRequest, ['media type error']);
            }

            if (_input.name) {
                region.setValue('name', _input.name);
            }
            if (_input.longitude) {
                region.setValue('longitude', _input.longitude);
            }
            if (_input.latitude) {
                region.setValue('latitude', _input.latitude);
            }
            if (_input.imageWidth) {
                region.setValue('imageWidth', _input.imageWidth);
            }
            if (_input.imageHeight) {
                region.setValue('imageHeight', _input.imageHeight);
            }
            if (_input.imageBase64) {
                let imageSrc: string = region.getValue('imageSrc');
                File.WriteBase64File(`${File.assetsPath}/${imageSrc}`, _input.imageBase64);
            }

            await region.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });

            return new Date();
        } catch (e) {
            Print.Log(new Error(JSON.stringify(e)), 'error');
            throw e;
        }
    },
);

/**
 * Action Delete
 */
type InputD = IRequest.ILocation.IRegionIndexD;

type OutputD = Date;

action.delete(
    { inputType: 'InputD' },
    async (data): Promise<OutputD> => {
        try {
            let _input: InputD = data.inputType;
            let _regionIds: string[] = [].concat(data.parameters.regionIds);

            _regionIds = _regionIds.filter((value, index, array) => {
                return array.indexOf(value) === index;
            });

            let tasks: Promise<any>[] = _regionIds.map<any>((value, index, array) => {
                return new Parse.Query(IDB.LocationRegion).get(value);
            });

            let regions: IDB.LocationRegion[] = await Promise.all(tasks).catch((e) => {
                throw e;
            });

            tasks = regions.map<any>((value, index, array) => {
                value.setValue('isDeleted', true);
                value.setValue('deleter', data.user);

                return value.save(null, { useMasterKey: true });
            });

            await Promise.all(tasks).catch((e) => {
                throw e;
            });

            return new Date();
        } catch (e) {
            Print.Log(new Error(JSON.stringify(e)), 'error');
            throw e;
        }
    },
);
