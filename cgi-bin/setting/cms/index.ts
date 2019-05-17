import { IUser, Action, Restful, RoleList, Errors, Socket, Config } from 'core/cgi-package';
import { IRequest, IResponse, IDB } from '../../../custom/models';
import { Print, Regex, File, CMSService } from '../../../custom/helpers';
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

type OutputR = IResponse.ISetting.ICMSR;

action.get(
    async (data): Promise<OutputR> => {
        try {
            let _input: InputR = data.inputType;

            let config = Config.cms;

            return {
                protocol: config.protocol,
                ip: config.ip,
                port: config.port,
                account: config.account,
                password: config.password,
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
type InputU = IRequest.ISetting.ICMSU;

type OutputU = Date;

action.put(
    { inputType: 'InputU' },
    async (data): Promise<OutputU> => {
        try {
            let _input: InputU = data.inputType;

            if (!Regex.IsIp(_input.ip)) {
                throw Errors.throw(Errors.CustomBadRequest, ['ip error']);
            }
            if (!Regex.IsPort(_input.port.toString())) {
                throw Errors.throw(Errors.CustomBadRequest, ['port error']);
            }

            let cms: CMSService = new CMSService();
            cms.config = _input;

            cms.Initialization();

            let nvrs: CMSService.INvr[] = await cms.GetDeviceList();
            await SyncCamera(nvrs);

            await UpdateConfig('cms', _input);
            Config['cms'] = { ...Config['cms'], ..._input };

            File.CopyFile('workspace/config/custom/cms.ts', 'workspace/custom/assets/config/custom/cms.ts');

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
async function SyncCamera(nvrs: CMSService.INvr[]): Promise<void> {
    try {
        let cameras: IDB.Camera[] = await new Parse.Query(IDB.Camera)
            .equalTo('type', Enum.ECameraType.cms)
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

        let configs: IDB.IConfigCMSCamera[] = [].concat(
            ...nvrs.map((value, index, array) => {
                return value.channels.map((value1, index1, array1) => {
                    return {
                        name: value1.name,
                        nvrId: value.id,
                        channelId: value1.id,
                    };
                });
            }),
        );

        let tasks: Promise<any>[] = [].concat(
            ...cameras.map<any>((value, index, array) => {
                let config: IDB.IConfigCMSCamera = configs.find((vlaue1, index1, array1) => {
                    let _config: IDB.IConfigCMSCamera = value.getValue('config') as IDB.IConfigCMSCamera;

                    return _config.nvrId === vlaue1.nvrId && _config.channelId === vlaue1.channelId;
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
            .equalTo('type', Enum.ECameraType.cms)
            .find()
            .fail((e) => {
                throw e;
            });

        tasks = configs.map<any>((value, index, array) => {
            let camera: IDB.Camera = cameras.find((value1, index1, array1) => {
                let config: IDB.IConfigCMSCamera = value1.getValue('config') as IDB.IConfigCMSCamera;

                return config.nvrId === value.nvrId && config.channelId === value.channelId;
            });
            if (!camera) {
                camera = new IDB.Camera();

                camera.setValue('type', Enum.ECameraType.cms);
                camera.setValue('mode', Enum.ECameraMode.humanDetection);
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
