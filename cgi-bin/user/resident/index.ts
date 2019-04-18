import { IUser, Action, Restful, RoleList, Errors } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, Draw, Parser, Db } from '../../../custom/helpers';

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
        permission: [RoleList.Chairman, RoleList.DirectorGeneral, RoleList.Guard],
    },
    async (data): Promise<OutputC> => {
        try {
            let _input: InputC = data.inputType;
            let _userInfo = await Db.GetUserInfo(data);

            let resident: IDB.CharacterResident = await new Parse.Query(IDB.CharacterResident)
                .equalTo('community', _userInfo.community)
                .equalTo('address', _input.address)
                .first()
                .fail((e) => {
                    throw e;
                });

            if (resident) {
                throw Errors.throw(Errors.CustomBadRequest, ['duplicate address']);
            }

            resident = new IDB.CharacterResident();

            resident.setValue('creator', data.user);
            resident.setValue('community', _userInfo.community);
            resident.setValue('address', _input.address);
            resident.setValue('manageCost', _input.manageCost);
            resident.setValue('pointTotal', _input.pointTotal);
            resident.setValue('pointBalance', _input.pointTotal);
            resident.setValue('pointUpdateDate', new Date());

            await resident.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });

            resident.setValue('barcode', resident.id);

            await resident.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });

            if (_input.parkingId) {
                try {
                    let parking: IDB.Parking = await new Parse.Query(IDB.Parking).get(_input.parkingId).fail((e) => {
                        throw e;
                    });

                    if (parking.getValue('resident')) {
                        throw Errors.throw(Errors.CustomBadRequest, ['parking is using']);
                    }

                    parking.setValue('resident', resident);

                    await parking.save(null, { useMasterKey: true }).fail((e) => {
                        throw e;
                    });
                } catch (e) {
                    await resident.destroy({ useMasterKey: true }).fail((e) => {
                        throw e;
                    });

                    throw e;
                }
            }

            return {
                residentId: resident.id,
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

type OutputR = IResponse.IDataList<IResponse.IUser.IResidentIndexR[]>;

action.get(
    {
        inputType: 'InputR',
        permission: [RoleList.Chairman, RoleList.DeputyChairman, RoleList.FinanceCommittee, RoleList.DirectorGeneral, RoleList.Guard],
    },
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;
            let _userInfo = await Db.GetUserInfo(data);
            let _page: number = _input.page || 1;
            let _count: number = _input.count || 10;

            let query: Parse.Query<IDB.CharacterResident> = new Parse.Query(IDB.CharacterResident).equalTo('community', _userInfo.community);

            let total: number = await query.count().fail((e) => {
                throw e;
            });

            let residents: IDB.CharacterResident[] = await query
                .skip((_page - 1) * _count)
                .limit(_count)
                .find()
                .fail((e) => {
                    throw e;
                });

            let tasks: Promise<any>[] = residents.map<any>((value, index, array) => {
                return new Parse.Query(IDB.CharacterResidentInfo)
                    .equalTo('resident', value)
                    .equalTo('isDeleted', false)
                    .count();
            });
            let residentInfoCounts: number[] = await Promise.all(tasks).catch((e) => {
                throw e;
            });

            tasks = residents.map<any>((value, index, array) => {
                return new Parse.Query(IDB.Parking).equalTo('resident', value).find();
            });
            let parkingss: IDB.Parking[][] = await Promise.all(tasks).catch((e) => {
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
                        barcode: Parser.Base64Str2HtmlSrc(Draw.Barcode(value.getValue('barcode'), 0.5, true, 25).toString(Parser.Encoding.base64)),
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
 * Action Delete
 */
type InputD = IRequest.IUser.IResidentIndexD;

type OutputD = Date;

action.delete(
    {
        inputType: 'InputD',
        loginRequired: true,
        permission: [RoleList.Chairman, RoleList.DirectorGeneral],
    },
    async (data): Promise<OutputD> => {
        try {
            let _input: InputD = data.inputType;
            let _userInfo = await Db.GetUserInfo(data);
            let _residentIds: string[] = [].concat(data.parameters.residentIds);

            _residentIds = _residentIds.filter((value, index, array) => {
                return array.indexOf(value) === index;
            });

            let tasks: Promise<any>[] = _residentIds.map<any>((value, index, array) => {
                let resident: IDB.CharacterResident = new IDB.CharacterResident();
                resident.id = value;

                return new Parse.Query(IDB.CharacterResidentInfo).equalTo('resident', resident).find();
            });
            let residentInfos: IDB.CharacterResidentInfo[] = [].concat(
                ...(await Promise.all(tasks).catch((e) => {
                    throw e;
                })),
            );

            tasks = residentInfos.map<any>((value, index, array) => {
                value.setValue('isDeleted', true);

                return value.save(null, { useMasterKey: true });
            });
            await Promise.all(tasks).catch((e) => {
                throw e;
            });

            return new Date();
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
