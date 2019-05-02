import { IUser, Action, Restful, RoleList, Errors, Socket } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, Utility } from '../../../custom/helpers';
import * as Enum from '../../../custom/enums';

let action = new Action({
    loginRequired: true,
});

export default action;

/**
 * Action Create
 */
type InputC = IRequest.ILocation.IAreaC;

type OutputC = IResponse.ILocation.IAreaC;

action.post(
    {
        inputType: 'InputC',
        permission: [RoleList.Admin],
    },
    async (data): Promise<OutputC> => {
        try {
            let _input: InputC = data.inputType;

            let floor: IDB.LocationFloor = await new Parse.Query(IDB.LocationFloor).get(_input.floorId).fail((e) => {
                throw e;
            });
            if (!floor) {
                throw Errors.throw(Errors.CustomBadRequest, ['floor not found']);
            }

            let action = _input.action;
            action.sgsms = action.sgsms.sort((a, b) => {
                return a.triggerCount > b.triggerCount ? 1 : -1;
            });
            action.smtp = action.smtp.sort((a, b) => {
                return a.triggerCount > b.triggerCount ? 1 : -1;
            });

            let area: IDB.LocationArea = new IDB.LocationArea();

            area.setValue('creator', data.user);
            area.setValue('isDeleted', false);
            area.setValue('floor', floor);
            area.setValue('name', _input.name);
            area.setValue('action', action);
            area.setValue('dataWindowX', _input.dataWindowX);
            area.setValue('dataWindowY', _input.dataWindowY);

            await area.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });

            return {
                objectId: area.id,
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
type InputR = IRequest.IDataList & IRequest.ILocation.IAreaR;

type OutputR = IResponse.IDataList<IResponse.ILocation.IAreaR>;

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

            let query: Parse.Query<IDB.LocationArea> = new Parse.Query(IDB.LocationArea).equalTo('isDeleted', false);

            if (_input.floorId) {
                let floor: IDB.LocationFloor = new IDB.LocationFloor();
                floor.id = _input.floorId;

                query.equalTo('floor', floor);
            }

            let total: number = await query.count().fail((e) => {
                throw e;
            });
            let totalPage: number = Math.ceil(total / _pageSize);

            let areas: IDB.LocationArea[] = await query
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
                results: areas.map((value, index, array) => {
                    let action = value.getValue('action');
                    action.sgsms = action.sgsms.sort((a, b) => {
                        return a.triggerCount > b.triggerCount ? 1 : -1;
                    });
                    action.smtp = action.smtp.sort((a, b) => {
                        return a.triggerCount > b.triggerCount ? 1 : -1;
                    });

                    return {
                        objectId: value.id,
                        floorId: value.getValue('floor').id,
                        name: value.getValue('name'),
                        action: action,
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
type InputU = IRequest.ILocation.IAreaU;

type OutputU = Date;

action.put(
    {
        inputType: 'InputU',
        permission: [RoleList.Admin],
    },
    async (data): Promise<OutputU> => {
        try {
            let _input: InputU = data.inputType;

            let area: IDB.LocationArea = await new Parse.Query(IDB.LocationArea).get(_input.objectId).fail((e) => {
                throw e;
            });
            if (!area) {
                throw Errors.throw(Errors.CustomBadRequest, ['area not found']);
            }

            if (_input.name) {
                area.setValue('name', _input.name);
            }
            if (_input.action) {
                let action = _input.action;
                action.sgsms = action.sgsms.sort((a, b) => {
                    return a.triggerCount > b.triggerCount ? 1 : -1;
                });
                action.smtp = action.smtp.sort((a, b) => {
                    return a.triggerCount > b.triggerCount ? 1 : -1;
                });

                area.setValue('action', _input.action);
            }
            if (_input.dataWindowX || _input.dataWindowX === 0) {
                area.setValue('dataWindowX', _input.dataWindowX);
            }
            if (_input.dataWindowY || _input.dataWindowY === 0) {
                area.setValue('dataWindowY', _input.dataWindowY);
            }

            await area.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });

            // Utility.ReStartServer();

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
type InputD = IRequest.ILocation.IAreaD;

type OutputD = Date;

action.delete(
    {
        inputType: 'InputD',
        permission: [RoleList.Admin],
    },
    async (data): Promise<OutputD> => {
        try {
            let _input: InputD = data.inputType;

            let area: IDB.LocationArea = await new Parse.Query(IDB.LocationArea).get(_input.objectId).fail((e) => {
                throw e;
            });
            if (!area) {
                throw Errors.throw(Errors.CustomBadRequest, ['area not found']);
            }

            area.setValue('isDeleted', true);
            area.setValue('deleter', data.user);

            await area.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });

            // Utility.ReStartServer();

            return new Date();
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
