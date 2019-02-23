import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, CharacterResident, CharacterResidentInfo, Parking } from '../../../custom/models';
import { Print, Draw, Parser } from '../../../custom/helpers';

let action = new Action({
    loginRequired: true,
});

export default action;

/**
 * Action Create
 */
type InputC = IRequest.IUser.IResidentIndexC;

type OutputC = IResponse.IUser.IResidentIndexC;

action.post(
    {
        inputType: 'InputC',
        permission: [RoleList.SystemAdministrator, RoleList.Administrator, RoleList.Chairman, RoleList.DirectorGeneral, RoleList.Guard],
    },
    async (data): Promise<OutputC> => {
        let _input: InputC = data.inputType;

        let resident: CharacterResident = await new Parse.Query(CharacterResident)
            .equalTo('address', _input.address)
            .first()
            .catch((e) => {
                throw e;
            });

        if (resident) {
            throw Errors.throw(Errors.CustomBadRequest, ['duplicate address']);
        }

        resident = new CharacterResident();
        resident.setValue('creator', data.user);
        resident.setValue('address', _input.address);
        resident.setValue('manageCost', _input.manageCost);
        resident.setValue('pointTotal', _input.pointTotal);
        resident.setValue('pointBalance', _input.pointTotal);
        resident.setValue('pointUpdateDate', new Date());
        resident.setValue('character', _input.character);

        await resident.save(null, { useMasterKey: true }).catch((e) => {
            throw e;
        });

        resident.setValue('barcode', resident.id);

        await resident.save(null, { useMasterKey: true }).catch((e) => {
            throw e;
        });

        if (_input.parkingId) {
            try {
                let parking: Parking = await new Parse.Query(Parking).get(_input.parkingId).catch((e) => {
                    throw e;
                });

                if (parking.getValue('resident')) {
                    throw Errors.throw(Errors.CustomBadRequest, ['parking is using']);
                }

                parking.setValue('resident', resident);

                await parking.save(null, { useMasterKey: true }).catch((e) => {
                    throw e;
                });
            } catch (e) {
                await resident.destroy({ useMasterKey: true }).catch((e) => {
                    throw e;
                });

                throw e;
            }
        }

        return {
            residentId: resident.id,
        };
    },
);

/**
 * Action Read
 */
type InputR = IRequest.IDataList;

type OutputR = IResponse.IDataList<IResponse.IUser.IResidentIndexR[]>;

action.get(
    {
        inputType: 'InputR',
        permission: [RoleList.SystemAdministrator, RoleList.Administrator, RoleList.Chairman, RoleList.DeputyChairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral, RoleList.Guard],
    },
    async (data): Promise<OutputR> => {
        let _input: InputR = data.inputType;
        let _page: number = _input.page || 1;
        let _count: number = _input.count || 10;

        let query: Parse.Query<CharacterResident> = new Parse.Query(CharacterResident);

        let total: number = await query.count().catch((e) => {
            throw e;
        });

        let residents: CharacterResident[] = await query
            .skip((_page - 1) * _count)
            .limit(_count)
            .find()
            .catch((e) => {
                throw e;
            });

        let tasks: Promise<any>[] = residents.map((value, index, array) => {
            return new Parse.Query(CharacterResidentInfo).equalTo('resident', value).count();
        });
        let residentInfoCounts: number[] = await Promise.all(tasks).catch((e) => {
            throw e;
        });

        tasks = residents.map((value, index, array) => {
            return new Parse.Query(Parking).equalTo('resident', value).find();
        });
        let parkingss: Parking[][] = await Promise.all(tasks).catch((e) => {
            throw e;
        });

        let parkingCosts: number[] = parkingss.map((value, index, array) => {
            return value
                .map((value, index, array) => {
                    return value.getValue('cost');
                })
                .reduce((prev, curr, index, array) => {
                    return prev + curr;
                }, 0);
        });

        return {
            total: total,
            page: _page,
            count: _count,
            content: residents.map((value, index, array) => {
                return {
                    residentId: value.id,
                    address: value.getValue('address'),
                    residentCount: residentInfoCounts[index],
                    parkingCost: parkingCosts[index],
                    manageCost: value.getValue('manageCost'),
                    pointTotal: value.getValue('pointTotal'),
                    pointBalance: value.getValue('pointBalance'),
                    character: value.getValue('character'),
                    barcode: Draw.Barcode(value.getValue('barcode'), 0.5, 25).toString(Parser.Encoding.base64),
                };
            }),
        };
    },
);
