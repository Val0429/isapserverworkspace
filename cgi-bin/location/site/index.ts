import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { File, Regex } from '../../../custom/helpers';
import * as Enum from '../../../custom/enums';

let action = new Action({
    loginRequired: true,
    permission: [RoleList.Admin],
});

export default action;

/**
 * Action Create
 */
type InputC = IRequest.ILocation.ISiteIndexC;

type OutputC = IResponse.ILocation.ISiteIndexC;

action.post(
    {
        inputType: 'InputC',
        postSizeLimit: 10000000,
    },
    async (data): Promise<OutputC> => {
        let _input: InputC = data.inputType;

        let iconExtension: string = File.GetExtension(_input.iconBase64);
        if (!iconExtension) {
            throw Errors.throw(Errors.CustomBadRequest, ['media type error']);
        }

        let imageExtension: string = File.GetExtension(_input.imageBase64);
        if (!imageExtension) {
            throw Errors.throw(Errors.CustomBadRequest, ['media type error']);
        }

        let region: IDB.LocationRegion = await new Parse.Query(IDB.LocationRegion).get(_input.regionId).fail((e) => {
            throw e;
        });
        if (!region) {
            throw Errors.throw(Errors.CustomBadRequest, ['region not found']);
        }

        if (!Regex.IsIp(_input.nvrConfig.ip)) {
            throw Errors.throw(Errors.CustomBadRequest, ['nvr ip error']);
        }
        if (!Regex.IsPort(_input.nvrConfig.port.toString())) {
            throw Errors.throw(Errors.CustomBadRequest, ['nvr port error']);
        }

        let site: IDB.LocationSite = new IDB.LocationSite();

        site.setValue('creator', data.user);
        site.setValue('isDeleted', false);
        site.setValue('region', region);
        site.setValue('name', _input.name);
        site.setValue('iconSrc', '');
        site.setValue('iconWidth', _input.iconWidth);
        site.setValue('iconHeight', _input.iconHeight);
        site.setValue('x', _input.x);
        site.setValue('y', _input.y);
        site.setValue('imageSrc', '');
        site.setValue('imageWidth', _input.imageWidth);
        site.setValue('imageHeight', _input.imageHeight);

        await site.save(null, { useMasterKey: true }).fail((e) => {
            throw e;
        });

        let iconSrc: string = `images/${site.id}_site_icon_${site.createdAt.getTime()}.${iconExtension}`;
        File.WriteBase64File(`${File.assetsPath}/${iconSrc}`, _input.iconBase64);

        site.setValue('iconSrc', iconSrc);

        let imageSrc: string = `images/${site.id}_site_image_${site.createdAt.getTime()}.${imageExtension}`;
        File.WriteBase64File(`${File.assetsPath}/${imageSrc}`, _input.imageBase64);

        site.setValue('imageSrc', imageSrc);

        await site.save(null, { useMasterKey: true }).fail((e) => {
            throw e;
        });

        let group: IDB.CameraGroup = new IDB.CameraGroup();

        group.setValue('creator', data.user);
        group.setValue('isDeleted', false);
        group.setValue('site', site);
        group.setValue('nvrConfig', _input.nvrConfig);
        group.setValue('action', _input.action);

        await group.save(null, { useMasterKey: true }).fail((e) => {
            throw e;
        });

        return {
            siteId: site.id,
        };
    },
);

/**
 * Action Read
 */
type InputR = IRequest.IDataList & IRequest.ILocation.ISiteIndexR;

type OutputR = IResponse.IDataList<IResponse.ILocation.ISiteIndexR[]>;

action.get(
    { inputType: 'InputR' },
    async (data): Promise<OutputR> => {
        let _input: InputR = data.inputType;
        let _page: number = _input.page || 1;
        let _count: number = _input.count || 10;

        let query: Parse.Query<IDB.LocationSite> = new Parse.Query(IDB.LocationSite).equalTo('isDeleted', false);

        if (_input.regionId) {
            let region: IDB.LocationRegion = new IDB.LocationRegion();
            region.id = _input.regionId;

            query = query.equalTo('region', region);
        }

        let total: number = await query.count().fail((e) => {
            throw e;
        });

        let sites: IDB.LocationSite[] = await query
            .skip((_page - 1) * _count)
            .limit(_count)
            .find()
            .fail((e) => {
                throw e;
            });

        let tasks: Promise<any>[] = sites.map<any>((value, index, array) => {
            return new Parse.Query(IDB.CameraGroup).equalTo('site', value).first();
        });
        let groups: IDB.CameraGroup[] = await Promise.all(tasks).catch((e) => {
            throw e;
        });

        return {
            total: total,
            page: _page,
            count: _count,
            content: sites.map((value, index, array) => {
                return {
                    regionId: value.getValue('region').id,
                    siteId: value.id,
                    name: value.getValue('name'),
                    iconSrc: value.getValue('iconSrc'),
                    iconWidth: value.getValue('iconWidth'),
                    iconHeight: value.getValue('iconHeight'),
                    x: value.getValue('x'),
                    y: value.getValue('y'),
                    imageSrc: value.getValue('imageSrc'),
                    imageWidth: value.getValue('imageWidth'),
                    imageHeight: value.getValue('imageHeight'),
                    nvrConfig: groups[index] ? groups[index].getValue('nvrConfig') : undefined,
                    action: groups[index] ? groups[index].getValue('action') : undefined,
                };
            }),
        };
    },
);

/**
 * Action update
 */
type InputU = IRequest.ILocation.ISiteIndexU;

type OutputU = Date;

action.put(
    {
        inputType: 'InputU',
        postSizeLimit: 10000000,
    },
    async (data): Promise<OutputU> => {
        let _input: InputU = data.inputType;

        let site: IDB.LocationSite = await new Parse.Query(IDB.LocationSite).get(_input.siteId).fail((e) => {
            throw e;
        });
        if (!site) {
            throw Errors.throw(Errors.CustomBadRequest, ['site not found']);
        }

        let iconExtension: string = _input.iconBase64 ? File.GetExtension(_input.iconBase64) : 'aa';
        if (!iconExtension) {
            throw Errors.throw(Errors.CustomBadRequest, ['media type error']);
        }

        let imageExtension: string = _input.imageBase64 ? File.GetExtension(_input.imageBase64) : 'aa';
        if (!imageExtension) {
            throw Errors.throw(Errors.CustomBadRequest, ['media type error']);
        }

        let group: IDB.CameraGroup = await new Parse.Query(IDB.CameraGroup)
            .equalTo('site', site)
            .first()
            .fail((e) => {
                throw e;
            });
        if (!group) {
            throw Errors.throw(Errors.CustomBadRequest, ['group not found']);
        }

        if (_input.name) {
            site.setValue('name', _input.name);
        }
        if (_input.iconWidth) {
            site.setValue('iconWidth', _input.iconWidth);
        }
        if (_input.iconHeight) {
            site.setValue('iconHeight', _input.iconHeight);
        }
        if (_input.x) {
            site.setValue('x', _input.x);
        }
        if (_input.y) {
            site.setValue('y', _input.y);
        }
        if (_input.iconBase64) {
            let iconSrc: string = site.getValue('iconSrc');
            File.WriteBase64File(`${File.assetsPath}/${iconSrc}`, _input.iconBase64);
        }
        if (_input.imageWidth) {
            site.setValue('imageWidth', _input.imageWidth);
        }
        if (_input.imageHeight) {
            site.setValue('imageHeight', _input.imageHeight);
        }
        if (_input.imageBase64) {
            let imageSrc: string = site.getValue('imageSrc');
            File.WriteBase64File(`${File.assetsPath}/${imageSrc}`, _input.imageBase64);
        }

        await site.save(null, { useMasterKey: true }).fail((e) => {
            throw e;
        });

        if (_input.nvrConfig) {
            if (!Regex.IsIp(_input.nvrConfig.ip)) {
                throw Errors.throw(Errors.CustomBadRequest, ['nvr ip error']);
            }
            if (!Regex.IsPort(_input.nvrConfig.port.toString())) {
                throw Errors.throw(Errors.CustomBadRequest, ['nvr port error']);
            }

            group.setValue('nvrConfig', _input.nvrConfig);
        }
        if (_input.action) {
            group.setValue('action', _input.action);
        }

        await group.save(null, { useMasterKey: true }).fail((e) => {
            throw e;
        });

        return new Date();
    },
);

/**
 * Action Delete
 */
type InputD = IRequest.ILocation.ISiteIndexD;

type OutputD = Date;

action.delete(
    { inputType: 'InputD' },
    async (data): Promise<OutputD> => {
        let _input: InputD = data.inputType;
        let _siteIds: string[] = [].concat(data.parameters.siteIds);

        _siteIds = _siteIds.filter((value, index, array) => {
            return array.indexOf(value) === index;
        });

        let tasks: Promise<any>[] = _siteIds.map<any>((value, index, array) => {
            return new Parse.Query(IDB.LocationSite).get(value);
        });

        let sites: IDB.LocationSite[] = await Promise.all(tasks).catch((e) => {
            throw e;
        });

        tasks = sites.map<any>((value, index, array) => {
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
