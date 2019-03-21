import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../custom/models';
import { File, Db } from '../../custom/helpers';
import * as Enum from '../../custom/enums';
import * as Notice from '../../custom/services/notice';

let action = new Action({
    loginRequired: true,
});

export default action;

/**
 * Action Create
 */
type InputC = IRequest.IPublicFacility.IIndexC;

type OutputC = IResponse.IPublicFacility.IIndexC;

action.post(
    {
        inputType: 'InputC',
        postSizeLimit: 10000000,
        permission: [RoleList.Chairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral],
    },
    async (data): Promise<OutputC> => {
        let _input: InputC = data.inputType;
        let _userInfo = await Db.GetUserInfo(data);
        let _openDates: IDB.IDayRange[] = _input.openDates.map((value, index, array) => {
            return {
                startDay: value.startDay,
                endDay: value.endDay,
                startDate: new Date(new Date(value.startDate).setFullYear(2000, 0, 1)),
                endDate: new Date(new Date(value.endDate).setFullYear(2000, 0, 1)),
            };
        });
        let _maintenanceDates: IDB.IDayRange[] = _input.maintenanceDates.map((value, index, array) => {
            return {
                startDay: value.startDay,
                endDay: value.endDay,
                startDate: new Date(new Date(value.startDate).setFullYear(2000, 0, 1)),
                endDate: new Date(new Date(value.endDate).setFullYear(2000, 0, 1)),
            };
        });

        let publicFacility: IDB.PublicFacility = new IDB.PublicFacility();

        publicFacility.setValue('creator', data.user);
        publicFacility.setValue('community', _userInfo.community);
        publicFacility.setValue('name', _input.name);
        publicFacility.setValue('description', _input.description);
        publicFacility.setValue('limit', _input.limit);
        publicFacility.setValue('openDates', _openDates);
        publicFacility.setValue('maintenanceDates', _maintenanceDates);
        publicFacility.setValue('facilitySrc', '');
        publicFacility.setValue('pointCost', _input.pointCost);
        publicFacility.setValue('isDeleted', false);

        await publicFacility.save(null, { useMasterKey: true }).catch((e) => {
            throw e;
        });

        let facilitySrc: string = `images/${publicFacility.id}_facility_${publicFacility.createdAt.getTime()}.png`;
        File.WriteBase64File(`${File.assetsPath}/${facilitySrc}`, _input.facilityImage);

        publicFacility.setValue('facilitySrc', facilitySrc);

        await publicFacility.save(null, { useMasterKey: true }).catch((e) => {
            throw e;
        });

        return {
            publicFacilityId: publicFacility.id,
        };
    },
);

/**
 * Action Read
 */
type InputR = IRequest.IDataList;

type OutputR = IResponse.IDataList<IResponse.IPublicFacility.IIndexR[]>;

action.get(
    {
        inputType: 'InputR',
        permission: [RoleList.Chairman, RoleList.DeputyChairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral, RoleList.Guard, RoleList.Resident],
    },
    async (data): Promise<OutputR> => {
        let _input: InputR = data.inputType;
        let _userInfo = await Db.GetUserInfo(data);
        let _page: number = _input.page || 1;
        let _count: number = _input.count || 10;

        let query: Parse.Query<IDB.PublicFacility> = new Parse.Query(IDB.PublicFacility).equalTo('community', _userInfo.community).equalTo('isDeleted', false);

        let total: number = await query.count().catch((e) => {
            throw e;
        });

        let publicFacilitys: IDB.PublicFacility[] = await query
            .skip((_page - 1) * _count)
            .limit(_count)
            .find()
            .catch((e) => {
                throw e;
            });

        return {
            total: total,
            page: _page,
            count: _count,
            content: publicFacilitys.map((value, index, array) => {
                return {
                    publicFacilityId: value.id,
                    name: value.getValue('name'),
                    description: value.getValue('description'),
                    limit: value.getValue('limit'),
                    openDates: value.getValue('openDates'),
                    maintenanceDates: value.getValue('maintenanceDates'),
                    facilitySrc: value.getValue('facilitySrc'),
                    pointCost: value.getValue('pointCost'),
                };
            }),
        };
    },
);

/**
 * Action update
 */
type InputU = IRequest.IPublicFacility.IIndexU;

type OutputU = Date;

action.put(
    {
        inputType: 'InputU',
        postSizeLimit: 10000000,
        permission: [RoleList.Chairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral],
    },
    async (data): Promise<OutputU> => {
        let _input: InputU = data.inputType;
        let _userInfo = await Db.GetUserInfo(data);
        let _openDates: IDB.IDayRange[] = _input.openDates.map((value, index, array) => {
            return {
                startDay: value.startDay,
                endDay: value.endDay,
                startDate: new Date(new Date(value.startDate).setFullYear(2000, 0, 1)),
                endDate: new Date(new Date(value.endDate).setFullYear(2000, 0, 1)),
            };
        });
        let _maintenanceDates: IDB.IDayRange[] = _input.maintenanceDates.map((value, index, array) => {
            return {
                startDay: value.startDay,
                endDay: value.endDay,
                startDate: new Date(new Date(value.startDate).setFullYear(2000, 0, 1)),
                endDate: new Date(new Date(value.endDate).setFullYear(2000, 0, 1)),
            };
        });

        let publicFacility: IDB.PublicFacility = await new Parse.Query(IDB.PublicFacility).get(_input.publicFacilityId).catch((e) => {
            throw e;
        });
        if (!publicFacility) {
            throw Errors.throw(Errors.CustomBadRequest, ['public facility not found']);
        }
        if (publicFacility.getValue('isDeleted')) {
            throw Errors.throw(Errors.CustomBadRequest, ['public facility was deleted']);
        }

        publicFacility.setValue('name', _input.name);
        publicFacility.setValue('description', _input.description);
        publicFacility.setValue('limit', _input.limit);
        publicFacility.setValue('openDates', _openDates);
        publicFacility.setValue('maintenanceDates', _maintenanceDates);
        publicFacility.setValue('pointCost', _input.pointCost);

        if (_input.facilityImage) {
            let facilitySrc: string = `images/${publicFacility.id}_facility_${publicFacility.createdAt.getTime()}.png`;
            File.WriteBase64File(`${File.assetsPath}/${facilitySrc}`, _input.facilityImage);

            publicFacility.setValue('facilitySrc', facilitySrc);
        }

        await publicFacility.save(null, { useMasterKey: true }).catch((e) => {
            throw e;
        });

        return new Date();
    },
);

/**
 * Action Delete
 */
type InputD = IRequest.IPublicFacility.IIndexD;

type OutputD = Date;

action.delete(
    {
        inputType: 'InputD',
        permission: [RoleList.Chairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral],
    },
    async (data): Promise<OutputD> => {
        let _input: InputD = data.inputType;
        let _userInfo = await Db.GetUserInfo(data);
        let _publicFacilityIds: string[] = [].concat(data.parameters.publicFacilityIds);

        _publicFacilityIds = _publicFacilityIds.filter((value, index, array) => {
            return array.indexOf(value) === index;
        });

        let tasks: Promise<any>[] = _publicFacilityIds.map((value, index, array) => {
            return new Parse.Query(IDB.PublicFacility).get(value);
        });
        let publicFacilitys: IDB.PublicFacility[] = await Promise.all(tasks).catch((e) => {
            throw e;
        });

        tasks = publicFacilitys.map((value, index, array) => {
            value.setValue('isDeleted', true);

            return value.save(null, { useMasterKey: true });
        });
        await Promise.all(tasks).catch((e) => {
            throw e;
        });

        tasks = publicFacilitys.map((value, index, array) => {
            return new Parse.Query(IDB.PublicFacilityReservation)
                .equalTo('facility', value)
                .include('facility')
                .find();
        });
        let reservations: IDB.PublicFacilityReservation[] = [].concat(
            ...(await Promise.all(tasks).catch((e) => {
                throw e;
            })),
        );
        reservations.forEach((value, index, array) => {
            Notice.notice$.next({
                resident: value.getValue('resident'),
                type: Enum.MessageType.publicFacilityDelete,
                data: value,
                message: {
                    facility: value.getValue('facility').getValue('name'),
                },
            });
        });

        return new Date();
    },
);
