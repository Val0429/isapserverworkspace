import { IUser, Action, Restful, RoleList, Errors, Socket } from 'core/cgi-package';
import { default as Ast } from 'services/ast-services/ast-client';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, Parser, Draw, Face, Demographic } from '../../../custom/helpers';
import * as Middleware from '../../../custom/middlewares';
import * as Enum from '../../../custom/enums';

let action = new Action({
    loginRequired: true,
    permission: [RoleList.Admin],
});

export default action;

type MultiData = IRequest.IMultiData;

/**
 * Action Create
 */
type InputC = IRequest.IPartner.IDemographicC[];

type OutputC = IResponse.IMultiData[];

action.post(
    {
        inputType: 'MultiData',
        middlewares: [Middleware.MultiDataFromBody],
    },
    async (data): Promise<OutputC> => {
        let _input: InputC = await Ast.requestValidation('InputC', data.parameters.datas);

        try {
            let resMessages: OutputC = data.parameters.resMessages;

            await Promise.all(
                _input.map(async (value, index, array) => {
                    try {
                        let analysis = await GetAnalysis(value, 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7').catch((e) => {
                            if (e !== 'face not found') throw e;
                        });

                        let server: IDB.ServerDemographic = new IDB.ServerDemographic();

                        server.setValue('name', value.name);
                        server.setValue('protocol', value.protocol);
                        server.setValue('ip', value.ip);
                        server.setValue('port', value.port);
                        server.setValue('margin', value.margin);

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

            IDB.ServerDemographic$.next({ crud: 'c' });

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

type OutputR = IResponse.IDataList<IResponse.IPartner.IDemographicR>;

action.get(
    {
        inputType: 'InputR',
        middlewares: [Middleware.PagingRequestDefaultValue],
    },
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;
            let _paging: IRequest.IPaging = _input.paging;

            let query: Parse.Query<IDB.ServerDemographic> = new Parse.Query(IDB.ServerDemographic);

            if (_input.keyword) {
                let query1 = new Parse.Query(IDB.ServerDemographic).matches('name', new RegExp(_input.keyword), 'i');
                let query2 = new Parse.Query(IDB.ServerDemographic).matches('ip', new RegExp(_input.keyword), 'i');
                query = Parse.Query.or(query1, query2);
            }

            if (_input.objectId) {
                query.equalTo('objectId', _input.objectId);
            }

            let total: number = await query.count().fail((e) => {
                throw e;
            });
            let totalPage: number = Math.ceil(total / _paging.pageSize);

            let servers: IDB.ServerDemographic[] = await query
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
                        name: value.getValue('name'),
                        protocol: value.getValue('protocol'),
                        ip: value.getValue('ip'),
                        port: value.getValue('port'),
                        margin: value.getValue('margin'),
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
type InputU = IRequest.IPartner.IDemographicU[];

type OutputU = IResponse.IMultiData[];

action.put(
    {
        inputType: 'MultiData',
        middlewares: [Middleware.MultiDataFromBody],
    },
    async (data): Promise<OutputU> => {
        let _input: InputU = await Ast.requestValidation('InputU', data.parameters.datas);

        try {
            let resMessages: OutputU = data.parameters.resMessages;

            await Promise.all(
                _input.map(async (value, index, array) => {
                    try {
                        let server: IDB.ServerDemographic = await new Parse.Query(IDB.ServerDemographic)
                            .equalTo('objectId', value.objectId)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (!server) {
                            throw Errors.throw(Errors.CustomBadRequest, ['server not found']);
                        }

                        let analysis = await GetAnalysis(value as IDB.IServerDemographic, 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7').catch((e) => {
                            if (e !== 'face not found') throw e;
                        });

                        if (value.name || value.name === '') {
                            server.setValue('name', value.name);
                        }
                        server.setValue('protocol', value.protocol);
                        server.setValue('ip', value.ip);
                        server.setValue('port', value.port);
                        server.setValue('margin', value.margin);

                        await server.save(null, { useMasterKey: true }).fail((e) => {
                            throw e;
                        });
                    } catch (e) {
                        resMessages[index] = Parser.E2ResMessage(e, resMessages[index]);

                        Print.Log(e, new Error(), 'error');
                    }
                }),
            );

            IDB.ServerDemographic$.next({ crud: 'u' });

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
            let _objectIds: string[] = data.parameters.objectIds;
            let resMessages: OutputD = data.parameters.resMessages;

            await Promise.all(
                _objectIds.map(async (value, index, array) => {
                    try {
                        let server: IDB.ServerDemographic = await new Parse.Query(IDB.ServerDemographic)
                            .equalTo('objectId', value)
                            .first()
                            .fail((e) => {
                                throw e;
                            });
                        if (!server) {
                            throw Errors.throw(Errors.CustomBadRequest, ['server not found']);
                        }

                        await server.destroy({ useMasterKey: true }).fail((e) => {
                            throw e;
                        });
                    } catch (e) {
                        resMessages[index] = Parser.E2ResMessage(e, resMessages[index]);

                        Print.Log(e, new Error(), 'error');
                    }
                }),
            );

            IDB.ServerDemographic$.next({ crud: 'd' });

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
export async function GetAnalysis(config: IDB.IServerDemographic, imageBase64: string): Promise<Demographic.ISap.IFeature[]> {
    try {
        let regex = /data:.*;base64, */;

        let buffer: Buffer = Buffer.from(imageBase64.replace(regex, ''), Parser.Encoding.base64);

        let faces: Draw.ILocation[] = await Face.Detect(buffer).catch((e) => {
            throw e;
        });
        let buffers: Buffer[] = await Draw.CutImage(faces, buffer).catch((e) => {
            throw e;
        });
        if (buffers.length === 0) {
            buffers.push(buffer);
        }

        let demo: Demographic.ISap = new Demographic.ISap();
        demo.config = {
            protocol: config.protocol,
            ip: config.ip,
            port: config.port,
        };
        demo.margin = config.margin;

        demo.Initialization();

        let features = await Promise.all(
            buffers.map(async (value, index, array) => {
                return await demo.GetAnalysis(value);
            }),
        ).catch((e) => {
            throw e;
        });

        return features;
    } catch (e) {
        throw e;
    }
}
