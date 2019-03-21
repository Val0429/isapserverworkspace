import { IUser, Action, Restful, RoleList, Errors, ParseObject } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../custom/models';
import { Print, Db } from '../../custom/helpers';

let action = new Action({
    loginRequired: true,
});

export default action;

/**
 * Action Create
 */
type InputC = IRequest.IParking.IIndexC;

type OutputC = IResponse.IParking.IIndexC;

action.post(
    {
        inputType: 'InputC',
        permission: [RoleList.Chairman, RoleList.DirectorGeneral],
    },
    async (data): Promise<OutputC> => {
        let _input: InputC = data.inputType;
        let _userInfo = await Db.GetUserInfo(data);

        let parking: IDB.Parking = await new Parse.Query(IDB.Parking)
            .equalTo('name', _input.name)
            .first()
            .catch((e) => {
                throw e;
            });
        if (parking) {
            throw Errors.throw(Errors.CustomBadRequest, ['duplicate name']);
        }

        parking = new IDB.Parking();

        parking.setValue('creator', data.user);
        parking.setValue('community', _userInfo.community);
        parking.setValue('name', _input.name);
        parking.setValue('cost', _input.cost);
        parking.setValue('isDeleted', false);

        await parking.save(null, { useMasterKey: true }).catch((e) => {
            throw e;
        });

        return {
            parkingId: parking.id,
        };
    },
);

/**
 * Action Read
 */
type InputR = IRequest.IDataList;

type OutputR = IResponse.IDataList<IResponse.IParking.IIndexR[]>;

action.get(
    {
        inputType: 'InputR',
        permission: [RoleList.Chairman, RoleList.DeputyChairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral, RoleList.Guard],
    },
    async (data): Promise<OutputR> => {
        let _input: InputR = data.inputType;
        let _userInfo = await Db.GetUserInfo(data);
        let _page: number = _input.page || 1;
        let _count: number = _input.count || 10;

        let query: Parse.Query<IDB.Parking> = new Parse.Query(IDB.Parking).equalTo('community', _userInfo.community).equalTo('isDeleted', false);

        let total: number = await query.count().catch((e) => {
            throw e;
        });

        let parkings: IDB.Parking[] = await query
            .skip((_page - 1) * _count)
            .limit(_count)
            .include('resident')
            .find()
            .catch((e) => {
                throw e;
            });

        let tasks: Promise<any>[] = parkings.map((value, index, array) => {
            return new Parse.Query(IDB.CharacterResidentInfo)
                .equalTo('resident', value.getValue('resident'))
                .equalTo('isDeleted', false)
                .first();
        });
        let residentInfos: IDB.CharacterResidentInfo[] = await Promise.all(tasks).catch((e) => {
            throw e;
        });

        return {
            total: total,
            page: _page,
            count: _count,
            content: parkings.map((value, index, array) => {
                let isResident: boolean = value.getValue('resident') !== null && value.getValue('resident') !== undefined;

                return {
                    parkingId: value.id,
                    parkingName: value.getValue('name'),
                    address: isResident ? value.getValue('resident').getValue('address') : '',
                    residentName: isResident && residentInfos[index] ? residentInfos[index].getValue('name') : '',
                    phone: isResident && residentInfos[index] ? residentInfos[index].getValue('phone') : '',
                };
            }),
        };
    },
);

/**
 * Action Delete
 */
type InputD = IRequest.IParking.IIndexD;

type OutputD = Date;

action.delete(
    {
        inputType: 'InputD',
        permission: [RoleList.Chairman, RoleList.DirectorGeneral],
    },
    async (data): Promise<OutputD> => {
        let _input: InputD = data.inputType;
        let _userInfo = await Db.GetUserInfo(data);
        let _parkingIds: string[] = [].concat(data.parameters.parkingIds);

        _parkingIds = _parkingIds.filter((value, index, array) => {
            return array.indexOf(value) === index;
        });

        let tasks: Promise<any>[] = _parkingIds.map((value, index, array) => {
            return new Parse.Query(IDB.Parking).get(value);
        });
        let parkings: IDB.Parking[] = await Promise.all(tasks).catch((e) => {
            throw e;
        });

        tasks = parkings.map((value, index, array) => {
            value.setValue('isDeleted', true);

            return value.save(null, { useMasterKey: true });
        });
        await Promise.all(tasks).catch((e) => {
            throw e;
        });

        return new Date();
    },
);
