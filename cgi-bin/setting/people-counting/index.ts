import { IUser, Action, Restful, RoleList, Errors, Socket, Config } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, PeopleCounting } from '../../../custom/helpers';
import * as Enum from '../../../custom/enums';

let action = new Action({
    loginRequired: true,
    permission: [RoleList.Admin],
});

export default action;

/**
 * Action Create
 */
type InputC = IRequest.ISetting.IPeopleCountingC;

type OutputC = IResponse.ISetting.IPeopleCountingC;

action.post(
    { inputType: 'InputC' },
    async (data): Promise<OutputC> => {
        try {
            let _input: InputC = data.inputType;

            let pc: PeopleCounting.Eocortex = new PeopleCounting.Eocortex();
            pc.config = {
                protocol: _input.protocol,
                ip: _input.ip,
                port: _input.port,
                account: _input.account,
                password: _input.password,
            };

            pc.Initialization();

            let channels: PeopleCounting.Eocortex.IChannel[] = await pc.GetDeviceList();

            let server: IDB.ConfigEocorpexServer = new IDB.ConfigEocorpexServer();

            server.setValue('protocol', _input.protocol);
            server.setValue('ip', _input.ip);
            server.setValue('port', _input.port);
            server.setValue('account', _input.account);
            server.setValue('password', _input.password);

            await server.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });

            await Promise.all(
                channels.map(async (value, index, array) => {
                    let camera: IDB.Camera = new IDB.Camera();

                    camera.setValue('type', Enum.ECameraType.eocortex);
                    camera.setValue('mode', Enum.ECameraMode.peopleCounting);
                    camera.setValue('name', value.Name);
                    camera.setValue('config', {
                        server: server,
                        name: value.Name,
                        id: value.Id,
                    });
                    camera.setValue('rois', []);

                    await camera.save(null, { useMasterKey: true }).fail((e) => {
                        throw e;
                    });
                }),
            ).catch((e) => {
                throw e;
            });

            IDB.ConfigEocorpexServer$.next({ crud: 'c' });

            return {
                objectId: server.id,
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
type InputR = IRequest.IDataList & IRequest.ISetting.IPeopleCountingR;

type OutputR = IResponse.IDataList<IResponse.ISetting.IPeopleCountingR>;

action.get(
    { inputType: 'InputR' },
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;
            let _paging: IRequest.IPaging = _input.paging || { page: 1, pageSize: 10 };
            let _page: number = _paging.page || 1;
            let _pageSize: number = _paging.pageSize || 10;

            let query: Parse.Query<IDB.ConfigEocorpexServer> = new Parse.Query(IDB.ConfigEocorpexServer);

            if (_input.objectId) {
                query.equalTo('objectId', _input.objectId);
            }

            let total: number = await query.count().fail((e) => {
                throw e;
            });
            let totalPage: number = Math.ceil(total / _pageSize);

            let servers: IDB.ConfigEocorpexServer[] = await query
                .skip((_page - 1) * _pageSize)
                .limit(_pageSize)
                .find()
                .fail((e) => {
                    throw e;
                });

            let ids: string[] = servers.map((value, index, array) => {
                return value.id;
            });
            let cameras: IDB.Camera[] = await new Parse.Query(IDB.Camera)
                .containedIn('config.server.objectId', ids)
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
                results: servers.map((value, index, array) => {
                    let _cameras: IDB.Camera[] = cameras.filter((value1, index1, array1) => {
                        return (value1.getValue('config') as IDB.IConfigEocorpexCamera).server.id === value.id;
                    });
                    return {
                        objectId: value.id,
                        protocol: value.getValue('protocol'),
                        ip: value.getValue('ip'),
                        port: value.getValue('port'),
                        account: value.getValue('account'),
                        password: value.getValue('password'),
                        cameras: _cameras.map((value1, index1, array1) => {
                            return {
                                cameraId: value1.id,
                                name: value1.getValue('name'),
                            };
                        }),
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
type InputU = IRequest.ISetting.IPeopleCountingU;

type OutputU = Date;

action.put(
    { inputType: 'InputU' },
    async (data): Promise<OutputU> => {
        try {
            let _input: InputU = data.inputType;

            let pc: PeopleCounting.Eocortex = new PeopleCounting.Eocortex();
            pc.config = {
                protocol: _input.protocol,
                ip: _input.ip,
                port: _input.port,
                account: _input.account,
                password: _input.password,
            };

            pc.Initialization();

            let channels: PeopleCounting.Eocortex.IChannel[] = await pc.GetDeviceList();

            let server: IDB.ConfigEocorpexServer = await new Parse.Query(IDB.ConfigEocorpexServer).get(_input.objectId).fail((e) => {
                throw e;
            });
            if (!server) {
                throw Errors.throw(Errors.CustomBadRequest, ['server not found']);
            }

            server.setValue('protocol', _input.protocol);
            server.setValue('ip', _input.ip);
            server.setValue('port', _input.port);
            server.setValue('account', _input.account);
            server.setValue('password', _input.password);

            await server.save(null, { useMasterKey: true }).fail((e) => {
                throw e;
            });

            await SyncCamera(server, channels);

            IDB.ConfigEocorpexServer$.next({ crud: 'u' });

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
type InputD = IRequest.ISetting.IPeopleCountingD;

type OutputD = Date;

action.delete(
    { inputType: 'InputD' },
    async (data): Promise<OutputD> => {
        try {
            let _input: InputD = data.inputType;

            let server: IDB.ConfigEocorpexServer = await new Parse.Query(IDB.ConfigEocorpexServer).get(_input.objectId).fail((e) => {
                throw e;
            });
            if (!server) {
                throw Errors.throw(Errors.CustomBadRequest, ['server not found']);
            }

            let cameras: IDB.Camera[] = await new Parse.Query(IDB.Camera)
                .equalTo('config.server.objectId', server.id)
                .find()
                .fail((e) => {
                    throw e;
                });

            let devices: IDB.LocationDevice[] = await new Parse.Query(IDB.LocationDevice)
                .equalTo('isDeleted', false)
                .containedIn('camera', cameras)
                .find()
                .fail((e) => {
                    throw e;
                });

            await server.destroy({ useMasterKey: true }).fail((e) => {
                throw e;
            });

            await Promise.all(
                cameras.map(async (value, index, array) => {
                    await value.destroy({ useMasterKey: true }).fail((e) => {
                        throw e;
                    });
                }),
            ).catch((e) => {
                throw e;
            });

            await Promise.all(
                devices.map(async (value, index, array) => {
                    await value.destroy({ useMasterKey: true }).fail((e) => {
                        throw e;
                    });
                }),
            ).catch((e) => {
                throw e;
            });

            IDB.ConfigEocorpexServer$.next({ crud: 'd' });

            return new Date();
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);

/**
 * Sync cms camera
 * @param nvrs
 */
async function SyncCamera(server: IDB.ConfigEocorpexServer, channels: PeopleCounting.Eocortex.IChannel[]): Promise<void> {
    try {
        let cameras: IDB.Camera[] = await new Parse.Query(IDB.Camera)
            .equalTo('config.server.objectId', server.id)
            .find()
            .fail((e) => {
                throw e;
            });

        let devices: IDB.LocationDevice[] = await new Parse.Query(IDB.LocationDevice)
            .equalTo('isDeleted', false)
            .containedIn('camera', cameras)
            .find()
            .fail((e) => {
                throw e;
            });

        let configs: IDB.IConfigEocorpexCamera[] = channels.map((value, index, array) => {
            return {
                server: server,
                id: value.Id,
                name: value.Name,
            };
        });

        let tasks: Promise<any>[] = [].concat(
            ...cameras.map<any>((value, index, array) => {
                let config: IDB.IConfigEocorpexCamera = configs.find((vlaue1, index1, array1) => {
                    let _config: IDB.IConfigEocorpexCamera = value.getValue('config') as IDB.IConfigEocorpexCamera;

                    return _config.id === vlaue1.id;
                });
                if (config) {
                    value.setValue('name', config.name);
                    value.setValue('config', config);

                    return [value.save(null, { useMasterKey: true })];
                } else {
                    let _devices: IDB.LocationDevice[] = devices.filter((value1, index1, array1) => {
                        return value1.getValue('camera').id === value.id;
                    });
                    return [
                        value.destroy({ useMasterKey: true }),
                        ..._devices.map((value1, index1, array1) => {
                            value1.setValue('isDeleted', true);

                            return value1.save(null, { useMasterKey: true });
                        }),
                    ];
                }
            }),
        );

        await Promise.all(tasks).catch((e) => {
            throw e;
        });

        cameras = await new Parse.Query(IDB.Camera)
            .equalTo('config.server.objectId', server.id)
            .find()
            .fail((e) => {
                throw e;
            });

        tasks = configs.map<any>((value, index, array) => {
            let camera: IDB.Camera = cameras.find((value1, index1, array1) => {
                let config: IDB.IConfigEocorpexCamera = value1.getValue('config') as IDB.IConfigEocorpexCamera;

                return config.id === value.id;
            });
            if (!camera) {
                camera = new IDB.Camera();

                camera.setValue('type', Enum.ECameraType.eocortex);
                camera.setValue('mode', Enum.ECameraMode.peopleCounting);
                camera.setValue('name', value.name);
                camera.setValue('config', value);
                camera.setValue('rois', []);

                return camera.save(null, { useMasterKey: true });
            }
        });

        await Promise.all(tasks).catch((e) => {
            throw e;
        });
    } catch (e) {
        throw e;
    }
}
