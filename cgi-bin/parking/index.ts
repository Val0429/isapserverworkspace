import { IUser, Action, Restful, RoleList, Errors, ParseObject, CharacterResident } from 'core/cgi-package';
import { IRequest, IResponse, Parking, CharacterResidentInfo } from '../../custom/models';
import { Print } from 'workspace/custom/helpers';

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
        permission: [RoleList.SystemAdministrator, RoleList.Administrator, RoleList.Chairman, RoleList.DirectorGeneral],
    },
    async (data): Promise<OutputC> => {
        let _input: InputC = data.inputType;

        let parking: Parking = await new Parse.Query(Parking)
            .equalTo('name', _input.name)
            .first()
            .catch((e) => {
                throw e;
            });

        if (parking) {
            throw Errors.throw(Errors.CustomBadRequest, ['duplicate name']);
        }

        parking = new Parking();
        parking.setValue('creator', data.user);
        parking.setValue('name', _input.name);
        parking.setValue('cost', _input.cost);

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
        permission: [RoleList.SystemAdministrator, RoleList.Administrator, RoleList.Chairman, RoleList.DeputyChairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral, RoleList.Guard],
    },
    async (data): Promise<OutputR> => {
        let _input: InputR = data.inputType;
        let _page: number = _input.page || 1;
        let _count: number = _input.count || 10;

        let query: Parse.Query<Parking> = new Parse.Query(Parking).include('resident');

        let total: number = await query.count().catch((e) => {
            throw e;
        });

        let parkings: Parking[] = await query
            .skip((_page - 1) * _count)
            .limit(_count)
            .find()
            .catch((e) => {
                throw e;
            });

        let tasks: Promise<any>[] = parkings.map((value, index, array) => {
            return new Parse.Query(CharacterResidentInfo)
                .equalTo('resident', value.getValue('resident'))
                .first()
                .catch((e) => {
                    throw e;
                });
        });
        let residentInfos: CharacterResidentInfo[] = await Promise.all(tasks).catch((e) => {
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

type OutputD = string;

action.delete(
    {
        inputType: 'InputD',
        permission: [RoleList.SystemAdministrator, RoleList.Administrator, RoleList.Chairman, RoleList.DirectorGeneral],
    },
    async (data): Promise<OutputD> => {
        let _input: InputD = data.inputType;

        let tasks: Promise<any>[] = _input.parkingIds.map((value, index, array) => {
            return new Parse.Query(Parking).get(value);
        });
        let parkings: Parking[] = await Promise.all(tasks).catch((e) => {
            throw e;
        });

        tasks = parkings.map((value, index, array) => {
            return value.destroy({ useMasterKey: true });
        });
        await Promise.all(tasks).catch((e) => {
            throw e;
        });

        return '';
    },
);
