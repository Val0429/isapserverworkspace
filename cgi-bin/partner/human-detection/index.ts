import { IUser, Action, Restful, RoleList, Errors, Socket } from 'core/cgi-package';
import { default as Ast } from 'services/ast-services/ast-client';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, Db, Parser, HumanDetection } from '../../../custom/helpers';
import * as Middleware from '../../../custom/middlewares';
import * as Enum from '../../../custom/enums';
import * as Device from '../../device';

let action = new Action({
    loginRequired: true,
    permission: [RoleList.SuperAdministrator, RoleList.Admin],
});

export default action;

type MultiData = IRequest.IMultiData;

/**
 * Action Create
 */
type InputC = IRequest.IPartner.IHumanDetectionC[];

type OutputC = IResponse.IMultiData[];

action.post(
    {
        inputType: 'MultiData',
        middlewares: [Middleware.MultiDataFromBody],
    },
    async (data): Promise<OutputC> => {
        let _input: InputC = await Ast.requestValidation('InputC', data.parameters.datas);
        let _userInfo = await Db.GetUserInfo(data.request, data.user);

        try {
            let resMessages: OutputC = data.parameters.resMessages;

            await Promise.all(
                _input.map(async (value, index, array) => {
                    try {
                        let analysis = await GetAnalysis({ protocol: value.protocol, ip: value.ip, port: value.port }, value.target_score, 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');

                        let server: IDB.ServerHumanDetection = await new Parse.Query(IDB.ServerHumanDetection)
                            .equalTo('customId', value.customId)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (server) {
                            throw Errors.throw(Errors.CustomBadRequest, ['duplicate custom id']);
                        }

                        server = await new Parse.Query(IDB.ServerHumanDetection)
                            .equalTo('ip', value.ip)
                            .equalTo('port', value.port)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (server) {
                            throw Errors.throw(Errors.CustomBadRequest, ['duplicate server']);
                        }

                        server = new IDB.ServerHumanDetection();

                        server.setValue('customId', value.customId);
                        server.setValue('name', value.name);
                        server.setValue('protocol', value.protocol);
                        server.setValue('ip', value.ip);
                        server.setValue('port', value.port);
                        server.setValue('target_score', value.target_score);

                        await server.save(null, { useMasterKey: true }).fail((e) => {
                            throw e;
                        });

                        resMessages[index].objectId = server.id;
                    } catch (e) {
                        resMessages[index] = Parser.E2ResMessage(e, resMessages[index]);

                        Print.Log(e, new Error(), 'error');
                    }
                }),
            );

            IDB.ServerHumanDetection$.next({ crud: 'c' });

            return resMessages;
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

type OutputR = IResponse.IDataList<IResponse.IPartner.IHumanDetectionR>;

action.get(
    {
        inputType: 'InputR',
        middlewares: [Middleware.PagingRequestDefaultValue],
    },
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);
            let _paging: IRequest.IPaging = _input.paging;

            let query: Parse.Query<IDB.ServerHumanDetection> = new Parse.Query(IDB.ServerHumanDetection);

            if (_input.keyword) {
                let query1 = new Parse.Query(IDB.ServerHumanDetection).matches('name', new RegExp(_input.keyword), 'i');
                let query2 = new Parse.Query(IDB.ServerHumanDetection).matches('ip', new RegExp(_input.keyword), 'i');
                let query3 = new Parse.Query(IDB.ServerHumanDetection).matches('customId', new RegExp(_input.keyword), 'i');
                query = Parse.Query.or(query1, query2, query3);
            }

            if (_input.objectId) {
                query.equalTo('objectId', _input.objectId);
            }

            let total: number = await query.count().fail((e) => {
                throw e;
            });
            let totalPage: number = Math.ceil(total / _paging.pageSize);

            let servers: IDB.ServerHumanDetection[] = await query
                .skip((_paging.page - 1) * _paging.pageSize)
                .limit(_paging.pageSize)
                .find()
                .fail((e) => {
                    throw e;
                });

            return {
                paging: {
                    total: total,
                    totalPages: totalPage,
                    page: _paging.page,
                    pageSize: _paging.pageSize,
                },
                results: servers.map((value, index, array) => {
                    return {
                        objectId: value.id,
                        customId: value.getValue('customId'),
                        name: value.getValue('name'),
                        protocol: value.getValue('protocol'),
                        ip: value.getValue('ip'),
                        port: value.getValue('port'),
                        target_score: value.getValue('target_score'),
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
type InputU = IRequest.IPartner.IHumanDetectionU[];

type OutputU = IResponse.IMultiData[];

action.put(
    {
        inputType: 'MultiData',
        middlewares: [Middleware.MultiDataFromBody],
    },
    async (data): Promise<OutputU> => {
        let _input: InputU = await Ast.requestValidation('InputU', data.parameters.datas);
        let _userInfo = await Db.GetUserInfo(data.request, data.user);

        try {
            let resMessages: OutputU = data.parameters.resMessages;

            await Promise.all(
                _input.map(async (value, index, array) => {
                    try {
                        let analysis = await GetAnalysis({ protocol: value.protocol, ip: value.ip, port: value.port }, value.target_score, 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');

                        let server: IDB.ServerHumanDetection = await new Parse.Query(IDB.ServerHumanDetection)
                            .equalTo('objectId', value.objectId)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (!server) {
                            throw Errors.throw(Errors.CustomBadRequest, ['server not found']);
                        }

                        if (value.ip !== server.getValue('ip') || value.port !== server.getValue('port')) {
                            let server: IDB.ServerHumanDetection = await new Parse.Query(IDB.ServerHumanDetection)
                                .equalTo('ip', value.ip)
                                .equalTo('port', value.port)
                                .first()
                                .fail((e) => {
                                    throw e;
                                });
                            if (server) {
                                throw Errors.throw(Errors.CustomBadRequest, ['duplicate server']);
                            }
                        }

                        if (value.name || value.name === '') {
                            server.setValue('name', value.name);
                        }
                        server.setValue('protocol', value.protocol);
                        server.setValue('ip', value.ip);
                        server.setValue('port', value.port);
                        server.setValue('target_score', value.target_score);

                        await server.save(null, { useMasterKey: true }).fail((e) => {
                            throw e;
                        });
                    } catch (e) {
                        resMessages[index] = Parser.E2ResMessage(e, resMessages[index]);

                        Print.Log(e, new Error(), 'error');
                    }
                }),
            );

            IDB.ServerHumanDetection$.next({ crud: 'u' });

            return resMessages;
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);

/**
 * Action Delete
 */
type InputD = IRequest.IDelete;

type OutputD = IResponse.IMultiData[];

action.delete(
    {
        inputType: 'InputD',
        middlewares: [Middleware.MultiDataFromQuery],
    },
    async (data): Promise<OutputD> => {
        try {
            let _input: InputD = data.inputType;
            let _userInfo = await Db.GetUserInfo(data.request, data.user);
            let _objectIds: string[] = data.parameters.objectIds;
            let resMessages: OutputD = data.parameters.resMessages;

            await Promise.all(
                _objectIds.map(async (value, index, array) => {
                    try {
                        let server: IDB.ServerHumanDetection = await new Parse.Query(IDB.ServerHumanDetection)
                            .equalTo('objectId', value)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (!server) {
                            throw Errors.throw(Errors.CustomBadRequest, ['server not found']);
                        }

                        await Device.DeleteByHDServer(server);

                        await server.destroy({ useMasterKey: true }).fail((e) => {
                            throw e;
                        });
                    } catch (e) {
                        resMessages[index] = Parser.E2ResMessage(e, resMessages[index]);

                        Print.Log(e, new Error(), 'error');
                    }
                }),
            );

            IDB.ServerHumanDetection$.next({ crud: 'd' });

            return resMessages;
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);

/**
 * Get analysis
 * @param config
 * @param buffer
 */
export async function GetAnalysis(config: HumanDetection.ISap.IUrlConfig, score: number, imageBase64: string): Promise<{ locations: HumanDetection.ILocation[]; buffer: Buffer }> {
    try {
        let regex = /data:.*;base64, */;

        let buffer: Buffer = Buffer.from(imageBase64.replace(regex, ''), Parser.Encoding.base64);

        let hd: HumanDetection.ISap = new HumanDetection.ISap();
        hd.config = config;
        hd.score = score;

        hd.Initialization();

        let locations = await hd.GetAnalysis(buffer);

        return {
            locations: locations,
            buffer: buffer,
        };
    } catch (e) {
        throw Errors.throw(Errors.CustomBadRequest, [e]);
    }
}
