import { IUser, Action, Restful, RoleList, Errors, Socket, Config } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, Regex, FRSService } from '../../../custom/helpers';
import * as Enum from '../../../custom/enums';
import { UpdateConfig } from '../../config';

let action = new Action({
    loginRequired: true,
    permission: [RoleList.Admin],
});

export default action;

/**
 * Action Read
 */
type InputR = null;

type OutputR = IResponse.ISetting.IFRSR;

action.get(
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;

            let config = Config.frs;

            return {
                analysis: {
                    ip: config.analysis.ip,
                    port: config.analysis.port,
                    wsport: config.analysis.wsport,
                    account: config.analysis.account,
                    password: config.analysis.password,
                },
                manage: {
                    protocol: config.manage.protocol,
                    ip: config.manage.ip,
                    port: config.manage.port,
                    account: config.manage.account,
                    password: config.manage.password,
                },
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
type InputU = IRequest.ISetting.IFRSU;

type OutputU = Date;

action.put(
    { inputType: 'InputU' },
    async (data): Promise<OutputU> => {
        try {
            let _input: InputU = data.inputType;

            let config = {
                analysis: {
                    ..._input.analysis,
                    specialScoreForUnRecognizedFace: Config.frs.analysis.specialScoreForUnRecognizedFace,
                    throttleKeepSameFaceSeconds: Config.frs.analysis.throttleKeepSameFaceSeconds,
                },
                manage: _input.manage,
            };

            let frs: FRSService = new FRSService();
            frs.analysisConfig = config.analysis;
            frs.manageConfig = config.manage;

            frs.Initialization();

            let devices: FRSService.IDevice[] = await frs.GetDeviceList();
            await SyncCamera(devices);

            await UpdateConfig('frs', config);
            Config['frs'] = { ...Config['frs'], ...config };

            return new Date();
        } catch (e) {
            Print.Log(e, new Error(), 'error');
            throw e;
        }
    },
);

/**
 * Sync frs devices
 * @param frsDevices
 */
async function SyncCamera(frsDevices: FRSService.IDevice[]): Promise<void> {
    try {
        let cameras: IDB.Camera[] = await new Parse.Query(IDB.Camera)
            .equalTo('type', Enum.ECameraType.frs)
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

        let configs: IDB.IConfigFRSCamera[] = [].concat(
            ...frsDevices.map((value, index, array) => {
                return {
                    sourceid: value.sourceid,
                    location: value.location,
                };
            }),
        );

        let tasks: Promise<any>[] = [].concat(
            ...cameras.map<any>((value, index, array) => {
                let config: IDB.IConfigFRSCamera = configs.find((vlaue1, index1, array1) => {
                    let _config: IDB.IConfigFRSCamera = value.getValue('config');

                    return _config.location === vlaue1.location;
                });
                if (config) {
                    value.setValue('name', config.sourceid);
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
            .equalTo('type', Enum.ECameraType.frs)
            .find()
            .fail((e) => {
                throw e;
            });

        tasks = configs.map<any>((value, index, array) => {
            let camera: IDB.Camera = cameras.find((value1, index1, array1) => {
                let config: IDB.IConfigFRSCamera = value1.getValue('config');

                return config.location === value.location;
            });
            if (!camera) {
                camera = new IDB.Camera();

                camera.setValue('type', Enum.ECameraType.frs);
                camera.setValue('mode', Enum.ECameraMode.peopleCounting);
                camera.setValue('name', value.sourceid);
                camera.setValue('config', value);

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
