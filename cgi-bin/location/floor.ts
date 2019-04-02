import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../custom/models';
import { File } from '../../custom/helpers';
import * as Enum from '../../custom/enums';

let action = new Action({
    loginRequired: true,
    permission: [RoleList.Admin],
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
        postSizeLimit: 10000000,
    },
    async (data): Promise<OutputC> => {
        let _input: InputC = data.inputType;

        let extension: string = File.GetExtension(_input.imageBase64);
        if (!extension) {
            throw Errors.throw(Errors.CustomBadRequest, ['media type error']);
        }

        let site: IDB.LocationSite = await new Parse.Query(IDB.LocationSite).get(_input.siteId).fail((e) => {
            throw e;
        });
        if (!site) {
            throw Errors.throw(Errors.CustomBadRequest, ['site not found']);
        }

        let floor: IDB.LocationFloor = new IDB.LocationFloor();

        floor.setValue('creator', data.user);
        floor.setValue('isDeleted', false);
        floor.setValue('site', site);
        floor.setValue('name', _input.name);
        floor.setValue('floor', _input.floor);
        floor.setValue('imageSrc', '');
        floor.setValue('imageWidth', _input.imageWidth);
        floor.setValue('imageHeight', _input.imageHeight);

        await floor.save(null, { useMasterKey: true }).fail((e) => {
            throw e;
        });

        let imageSrc: string = `images/${floor.id}_floor_${floor.createdAt.getTime()}.${extension}`;
        File.WriteBase64File(`${File.assetsPath}/${imageSrc}`, _input.imageBase64);

        floor.setValue('imageSrc', imageSrc);

        await floor.save(null, { useMasterKey: true }).fail((e) => {
            throw e;
        });

        return {
            floorId: floor.id,
        };
    },
);

/**
 * Action Read
 */
type InputR = IRequest.IDataList & IRequest.ILocation.IFloorR;

type OutputR = IResponse.IDataList<IResponse.ILocation.IFloorR[]>;

action.get(
    { inputType: 'InputR' },
    async (data): Promise<OutputR> => {
        let _input: InputR = data.inputType;
        let _page: number = _input.page || 1;
        let _count: number = _input.count || 10;

        let query: Parse.Query<IDB.LocationFloor> = new Parse.Query(IDB.LocationFloor).equalTo('isDeleted', false);

        if (_input.siteId) {
            let site: IDB.LocationSite = new IDB.LocationSite();
            site.id = _input.siteId;

            query = query.equalTo('site', site);
        }

        let total: number = await query.count().fail((e) => {
            throw e;
        });

        let floors: IDB.LocationFloor[] = await query
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
            content: floors.map((value, index, array) => {
                return {
                    siteId: value.getValue('site').id,
                    floorId: value.id,
                    name: value.getValue('name'),
                    floor: value.getValue('floor'),
                    imageSrc: value.getValue('imageSrc'),
                    imageWidth: value.getValue('imageWidth'),
                    imageHeight: value.getValue('imageHeight'),
                };
            }),
        };
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
        postSizeLimit: 10000000,
    },
    async (data): Promise<OutputU> => {
        let _input: InputU = data.inputType;

        let floor: IDB.LocationFloor = await new Parse.Query(IDB.LocationFloor).get(_input.floorId).fail((e) => {
            throw e;
        });
        if (!floor) {
            throw Errors.throw(Errors.CustomBadRequest, ['floor not found']);
        }

        let extension: string = _input.imageBase64 ? File.GetExtension(_input.imageBase64) : 'aa';
        if (!extension) {
            throw Errors.throw(Errors.CustomBadRequest, ['media type error']);
        }

        if (_input.name) {
            floor.setValue('name', _input.name);
        }
        if (_input.floor) {
            floor.setValue('floor', _input.floor);
        }
        if (_input.imageWidth) {
            floor.setValue('imageWidth', _input.imageWidth);
        }
        if (_input.imageHeight) {
            floor.setValue('imageHeight', _input.imageHeight);
        }
        if (_input.imageBase64) {
            let imageSrc: string = `images/${floor.id}_floor_${floor.createdAt.getTime()}.${extension}`;
            File.WriteBase64File(`${File.assetsPath}/${imageSrc}`, _input.imageBase64);
        }

        await floor.save(null, { useMasterKey: true }).fail((e) => {
            throw e;
        });

        return new Date();
    },
);

/**
 * Action Delete
 */
type InputD = IRequest.ILocation.IFloorD;

type OutputD = Date;

action.delete(
    { inputType: 'InputD' },
    async (data): Promise<OutputD> => {
        let _input: InputD = data.inputType;
        let _floorIds: string[] = [].concat(data.parameters.floorIds);

        _floorIds = _floorIds.filter((value, index, array) => {
            return array.indexOf(value) === index;
        });

        let tasks: Promise<any>[] = _floorIds.map<any>((value, index, array) => {
            return new Parse.Query(IDB.LocationFloor).get(value);
        });

        let floors: IDB.LocationFloor[] = await Promise.all(tasks).catch((e) => {
            throw e;
        });

        tasks = floors.map<any>((value, index, array) => {
            value.setValue('isDeleted', true);
            value.setValue('deleter', data.user);

            return value.save(null, { useMasterKey: true });
        });

        await Promise.all(tasks).catch((e) => {
            throw e;
        });

        return new Date();
    },
);
