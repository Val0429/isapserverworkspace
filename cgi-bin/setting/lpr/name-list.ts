import { IUser, Action, Restful, RoleList, Errors, Socket } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print } from '../../../custom/helpers';
import * as Enum from '../../../custom/enums';

let action = new Action({
    loginRequired: true,
    permission: [RoleList.Admin],
});

export default action;

/**
 * Action Create
 */
type InputC = IRequest.ISetting.ILPRNameListC;

type OutputC = IResponse.ISetting.ILPRNameListC;

action.post(
    { inputType: 'InputC' },
    async (data): Promise<OutputC> => {
        try {
            let _input: InputC = data.inputType;

            let check: IDB.RuleNameList = await new Parse.Query(IDB.RuleNameList)
                .equalTo('name', _input.name)
                .first()
                .fail((e) => {
                    throw e;
                });
            if (check) {
                throw Errors.throw(Errors.CustomBadRequest, ['duplicate name']);
            }

            let name: IDB.RuleNameList = new IDB.RuleNameList();

            name.setValue('type', _input.type);
            name.setValue('name', _input.name);

            await name.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });

            IDB.RuleNameList$.next();

            return {
                objectId: name.id,
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
type InputR = IRequest.IDataList & IRequest.ISetting.ILPRNameListR;

type OutputR = IResponse.IDataList<IResponse.ISetting.ILPRNameListR>;

action.get(
    { inputType: 'InputR' },
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;
            let _paging: IRequest.IPaging = _input.paging || { page: 1, pageSize: 10 };
            let _page: number = _paging.page || 1;
            let _pageSize: number = _paging.pageSize || 10;

            let query: Parse.Query<IDB.RuleNameList> = new Parse.Query(IDB.RuleNameList);

            if (_input.type) {
                query.equalTo('type', _input.type);
            }

            let total: number = await query.count().fail((e) => {
                throw e;
            });
            let totalPage: number = Math.ceil(total / _pageSize);

            let names: IDB.RuleNameList[] = await query
                .ascending('name')
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
                results: names.map((value, index, array) => {
                    return {
                        objectId: value.id,
                        type: Enum.EIdentificationType[value.getValue('type')],
                        name: value.getValue('name'),
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
type InputU = IRequest.ISetting.ILPRNameListU;

type OutputU = Date;

action.put(
    { inputType: 'InputU' },
    async (data): Promise<OutputU> => {
        try {
            let _input: InputU = data.inputType;

            let name: IDB.RuleNameList = await new Parse.Query(IDB.RuleNameList).get(_input.objectId).fail((e) => {
                throw e;
            });
            if (!name) {
                throw Errors.throw(Errors.CustomBadRequest, ['name not found']);
            }

            if (_input.name && _input.name !== name.getValue('name')) {
                let check: IDB.RuleNameList = await new Parse.Query(IDB.RuleNameList)
                    .equalTo('name', _input.name)
                    .first()
                    .fail((e) => {
                        throw e;
                    });
                if (check) {
                    throw Errors.throw(Errors.CustomBadRequest, ['duplicate name']);
                }

                name.setValue('name', _input.name);
            }

            await name.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });

            IDB.RuleNameList$.next();

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
type InputD = IRequest.ISetting.ILPRNameListD;

type OutputD = Date;

action.delete(
    { inputType: 'InputD' },
    async (data): Promise<OutputD> => {
        try {
            let _input: InputD = data.inputType;

            let name: IDB.RuleNameList = await new Parse.Query(IDB.RuleNameList).get(_input.objectId).fail((e) => {
                throw e;
            });
            if (!name) {
                throw Errors.throw(Errors.CustomBadRequest, ['name not found']);
            }

            await name.destroy({ useMasterKey: true }).fail((e) => {
                throw e;
            });

            IDB.RuleNameList$.next();

            return new Date();
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);
